import { NextFunction, Request, Response } from 'express';
import ServerError from '../errors/serverError';

export default async function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction
) {
  let statusCode = 500;
  if (error instanceof ServerError) {
    statusCode = error.statusCode;
  }

  response.status(statusCode).json({
    success: false,
    message: error.message,
  });
}
