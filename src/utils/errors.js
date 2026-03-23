export class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "bad request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details = null) {
    super(message, 503, "DATABASE_ERROR", details);
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = "Database connection failed") {
    super(message, 503, "DATABASE_CONNECTION_ERROR");
  }
}

export class UniqueConstraintError extends AppError {
  constructor(message = "A record with this value already exists") {
    super(message, 409, "UNIQUE_CONSTRAINT_ERROR");
  }
}

export class ForeignKeyError extends AppError {
  constructor(message = "Referenced record does not exist") {
    super(message, 400, "FOREIGN_KEY_ERROR");
  }
}

//db operation Wrapper
export const handleDbError = (err, context = "Database operation") => {
  const code = err.code ?? err.cause?.code;

  if (code === "23505")
    throw new UniqueConstraintError(
      `${context}: duplicate value violates unique constraint`,
    );

  if (code === "23503")
    throw new ForeignKeyError(`${context}: referenced record does not exist`);

  if (code === "23502")
    throw new DatabaseError(
      `${context}: a required field is missing`,
      err.message,
    );
    
  if (code?.startsWith("08") || code === "57P01" || code === "53300")
    throw new DatabaseConnectionError(
      `${context}: unable to reach the database`,
    );

  throw new DatabaseError(`${context} failed`, err.message);
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class RetryableError extends AppError {
  constructor(message = "Transient failure, will retry") {
    super(message, 503, "RETRYABLE_ERROR");
  }
}

export class NonRetryableError extends AppError {
  constructor(message = "Permanent failure, job will be deactivated") {
    super(message, 422, "NON_RETRYABLE_ERROR");
  }
}
