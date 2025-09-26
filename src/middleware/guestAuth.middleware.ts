import { verifyToken } from '../utils/helpers';
import { Response, NextFunction } from 'express';
import { GuestAuthRequest } from '../interfaces';
import { UnauthorizedError } from '../utils/exceptions';

export const guestAuthMiddleware = async (req: GuestAuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies['accessToken'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('Access token is missing or invalid');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new UnauthorizedError('Access token is missing or invalid');
  }

  const playerId = decoded.userId;

  req.playerId = playerId;
  next();
}
