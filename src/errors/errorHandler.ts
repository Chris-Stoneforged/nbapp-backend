import { Request, Response, NextFunction } from 'express';

type ExpressRequest = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

export default function errorSafe(
  ...handlers: Array<ExpressRequest>
): ExpressRequest[] {
  return handlers.map((route) => handleErrors(route));
}

function handleErrors(fn: ExpressRequest): ExpressRequest {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      await fn(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}
