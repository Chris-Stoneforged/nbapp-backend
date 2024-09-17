import { Request, Response, NextFunction } from 'express';

export default async function securityHeaders(
  request: Request,
  response: Response,
  next: NextFunction
) {
  response.setHeader(
    'Content-Security-Policy',
    "script-src 'self' object-src 'none' style-src 'self' default-src 'self'"
  );
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader(
    'Strict-Transport-Security',
    'max-age=15552000 includeSubDomains'
  );
  response.removeHeader('X-Powered-By');

  next();
}
