import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ValidationError } from '../utils/exceptions';
import config from '../config/config';

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (err instanceof ValidationError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors
    });
    return;
  }

  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    errors: {},
    stack: config.nodeEnv === 'production' ? undefined : err.stack
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Resource not found',
    errors: {}
  });
};
