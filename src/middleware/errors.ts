import { NextFunction, Request, Response } from 'express';
import ServerError from 'src/serverError';

export default async function errorHandler(
  error: ServerError,
  _request: Request,
  response: Response,
  next: NextFunction
) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  response.status(statusCode).json({
    success: false,
    message: message,
  });
}
