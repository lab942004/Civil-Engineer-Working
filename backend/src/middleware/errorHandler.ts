import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Internal Server Error';

  // Handle Prisma known request errors (e.g., foreign key violations, unique constraint)
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists.`;
        break;
      case 'P2003':
        // Foreign key violation - likely userId from token doesn't exist in DB
        // Return 401 to force re-login (frontend will clear token and redirect)
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
        break;
      case 'P2025':
        statusCode = 404;
        message = `Record not found.`;
        break;
      case 'P2014':
        statusCode = 400;
        message = `The change you are trying to make would violate a required relation.`;
        break;
      default:
        statusCode = 400;
        message = err.message || 'Database error occurred.';
        break;
    }
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided. Please check your input fields.';
  }

  // Handle Multer upload errors (file too large, too many files, wrong field name)
  if (err.name === 'MulterError') {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large.';
        break;
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Only one file can be uploaded at a time.';
        break;
      default:
        message = 'File upload failed.';
    }
  }

  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.code && !err.code.startsWith('P') && { code: err.code }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};