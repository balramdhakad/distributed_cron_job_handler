export class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = null){
        super(message, 422, 'VALIDATION_ERROR', details)
    }
}
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RetryableError';
    this.retryable = true;
  }
}

export class NonRetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonRetryableError';
    this.retryable = false;
  }
}

export function isRetryable(err) {
  if (err && err.retryable === false) return false;
  return true;
}

























































