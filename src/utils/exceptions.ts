import { StatusCodes } from "http-status-codes";

export class HttpException extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class ValidationError extends HttpException {
  errors: string[];

  constructor(errors: string[]) {
    super(StatusCodes.BAD_REQUEST, 'Validation failed');
    this.errors = errors;
  }
}

export class BadRequestError extends HttpException {
  constructor(message: string = 'Bad request') {
    super(StatusCodes.BAD_REQUEST, message);
  }
}

export class NotFoundError extends HttpException {
  constructor(message: string = 'Resource not found') {
    super(StatusCodes.NOT_FOUND, message);
  }
}

export class UnauthorizedError extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(StatusCodes.FORBIDDEN, message);
  }
}

export class ServerError extends HttpException {
  constructor(message: string = 'Internal server error') {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
}