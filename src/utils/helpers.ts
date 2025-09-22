import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/config';
import { UnauthorizedError } from './exceptions';
import { redisClient } from "../config/redis.config";
import prisma from "../config/db.config";
import { DecodedToken, HashPassword } from '../interfaces';

export const hashPassword: HashPassword = async (password) => {
  const hash = await bcrypt.hash(password, config.saltRounds);
  return hash;
}

export const verifyPassword = async (password: string, hash: string) => {
  const result = await bcrypt.compare(password, hash);
  return result;
}

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '1d' });
}

export const generateRefresh = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

export const verifyToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, config.jwtSecret) as DecodedToken;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

export const updateCachedGame = async (gameId: string, updates: any) => {
  const cachedGame = await redisClient.get(`game:${gameId}`);
  if (cachedGame) {
    const game = JSON.parse(cachedGame);
    const updatedGame = { ...game, ...updates };
    await redisClient.set(`game:${gameId}`, JSON.stringify(updatedGame), 'EX', 1800);
    return updatedGame;
  }
  return null;
};

export const reconcileGameOnEnd = async (gameId: string, finalUpdates: any, namespace: string) => {
  const cachedGame = await redisClient.get(`game:${gameId}`);
  if (!cachedGame) {
    await redisClient.del(`game:${gameId}`);
    return;
  }

  if (namespace === '/auth') {
    const game = JSON.parse(cachedGame);
    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: game.boardState,
        moves: game.moves,
        ...finalUpdates
      }
    });
  } else if (namespace === "/guest") {
    const game = JSON.parse(cachedGame);
    await prisma.guestGame.update({
      where: { id: gameId },
      data: {
        boardState: game.boardState,
        moves: game.moves,
        ...finalUpdates
      }
    });
  }

  await redisClient.del(`game:${gameId}`);
};