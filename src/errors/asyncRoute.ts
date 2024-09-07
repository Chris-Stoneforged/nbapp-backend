import { Request, Response, NextFunction } from 'express';
import ServerError from './serverError';

type ExpressRequest = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

export default function AsyncRoute(fn: ExpressRequest): ExpressRequest {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      await fn(request, response, next);
    } catch (error) {
      if (error instanceof ServerError) {
        return next(error);
      }
      if (error instanceof Error) {
        return next(new ServerError(error.message, 500));
      }
      return next(new ServerError('Unknown server error', 500));
    }
  };
}
