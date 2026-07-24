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

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Only treat err.code as Prisma code if it is actually a string
  const prismaCode =
    typeof err?.code === 'string' ? err.code : undefined;

  // ==============================
  // Prisma Errors
  // ==============================
  if (prismaCode?.startsWith('P')) {
    switch (prismaCode) {
      case 'P2002':
        statusCode = 409;
        message = `A record with this ${
          err.meta?.target?.join(', ') || 'value'
        } already exists.`;
        break;

      case 'P2003':
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
        break;

      case 'P2025':
        statusCode = 404;
        message = 'Record not found.';
        break;

      case 'P2014':
        statusCode = 400;
        message =
          'The change you are trying to make would violate a required relation.';
        break;

      default:
        statusCode = 400;
        message = err.message || 'Database error occurred.';
    }
  }

  // ==============================
  // Prisma Validation Errors
  // ==============================
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided. Please check your input fields.';
  }

  // ==============================
  // Multer Errors
  // ==============================
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

  // ==============================
  // Detailed Error Logging
  // ==============================
  console.error('\n========== ERROR ==========');
  console.error('Time:', new Date().toISOString());
  console.error('Route:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Code:', err.code);
  console.error('Status:', err.status);
  console.error('Stack:\n', err.stack);

  if (err.response) {
    console.error('Response Status:', err.response.status);
    console.error('Response Data:', err.response.data);
  }

  if (err.errors) {
    console.error('Errors:', err.errors);
  }

  console.error('Full Error Object:', err);
  console.error('===========================\n');

  res.status(statusCode).json({
    success: false,
    message,
    ...(typeof err.code === 'string' &&
      !prismaCode?.startsWith('P') && {
        code: err.code,
      }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};