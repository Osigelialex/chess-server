import { verifyToken } from '../utils/helpers';
import { Response, NextFunction } from 'express';
import prisma from '../config/db.config';
import { AuthenticatedRequest } from '../interfaces';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies['accessToken'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }

  req.user = user;
  next();
}
