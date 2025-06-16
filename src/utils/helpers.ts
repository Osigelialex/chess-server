import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/config';
import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";
import { UnauthorizedError } from './exceptions';
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
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
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

export const generateRandomAvatar = (): string => {
  const avatars = [
    "Adrian",
    "Robert",
    "Amaya",
    "Liam",
    "Caleb",
    "Chase",
    "Leah",
    "Jack"
  ];

  const randomIndex = Math.floor(Math.random() * avatars.length);
  const avatarName = avatars[randomIndex];

  return createAvatar(botttsNeutral, {
    seed: avatarName,
  }).toString();
}
