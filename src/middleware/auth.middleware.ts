import { verifyToken } from '../utils/helpers';
import { Response, NextFunction } from 'express';
import prisma from '../config/db.config';
import { AuthenticatedRequest } from '../interfaces';
import { UnauthorizedError } from '../utils/exceptions';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies['accessToken'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('Access token is missing or invalid');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    throw new UnauthorizedError('Access token is missing or invalid');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new UnauthorizedError('Access token is missing or invalid'); 
  }

  req.user = user;
  next();
}
