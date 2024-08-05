import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prismaClient from '../prismaClient';

export async function isUserAuthenticated(
  request: Request,
  response: Response,
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
    response.status(401).json({
      success: false,
      message: 'User is not authorized',
    });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch (e) {
    response.status(401).json({
      success: false,
      message: `Error verifying token - ${e.message}`,
    });
    return;
  }

  const user = await prismaClient.user.findFirst({ where: { id: payload.id } });
  if (!user) {
    response.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  request.user = user;
  next();
}
