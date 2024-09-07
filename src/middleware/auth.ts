import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prismaClient from '../prismaClient';
import ServerError, {
  ForbiddenError,
  UnauthorizedError,
} from '../errors/serverError';
import { Role } from '@prisma/client';

export async function isUserAuthenticated(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  let token: string;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer ')
  ) {
    token = request.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('User is not authorized');
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch (e) {
    throw new UnauthorizedError(`Error verifying token - ${e.message}`);
  }

  const user = await prismaClient.user.findFirst({ where: { id: payload.id } });
  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  request.user = user;
  next();
}

export async function isAdmin(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  if (request.user.role !== Role.Admin) {
    throw new ForbiddenError('Access denied');
  }

  next();
}
