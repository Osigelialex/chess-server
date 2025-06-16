import { Request } from 'express';
import { User } from '../../generated/prisma';

export interface HashPassword {
  (password: string): Promise<string>;
}

export interface DecodedToken {
  userId: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}