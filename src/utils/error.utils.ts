export class CustomError extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class ValidationError extends CustomError {
  errors: string[];

  constructor(errors: string[]) {
    super(400, 'Validation failed');
    this.errors = errors;
  }
}
