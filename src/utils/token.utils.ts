import jwt from 'jsonwebtoken';
import config from '../config/config';

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
}

export const generateRefresh = (userId: string) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}
