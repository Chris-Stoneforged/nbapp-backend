import { NextFunction, Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ServerError from '../serverError';

export async function register(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const { email, nickname, password } = request.body;
  if (!email || !nickname || !password) {
    return next(new ServerError(400, 'Missing required information'));
  }

  // Make sure email is unique
  const existingUser = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (existingUser) {
    return next(new ServerError(400, 'Email is already in use'));
  }

  const hashedPassword = await encryptPassword(password);

  // Create new user
  const user: User = await prismaClient.user.create({
    data: {
      email: email,
      nickname: nickname,
      role: Role.User,
      password: hashedPassword,
    },
  });

  sendLoginResponseWithToken(response, user);
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const { email, password } = request.body;

  const user = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (!user) {
    return next(new ServerError(401, 'Incorrect email or password'));
  }

  const passwordMatch = await comparePasswords(user.password, password);
  if (!passwordMatch) {
    return next(new ServerError(401, 'Incorrect email or password'));
  }

  sendLoginResponseWithToken(response, user);
}

export async function logout(
  _request: Request,
  response: Response
): Promise<void> {
  response
    .status(200)
    .cookie('token', 'none', {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: 'Successfully logged out',
    });
}

async function comparePasswords(
  userPassword: string,
  loginPassword: string
): Promise<boolean> {
  return await bcrypt.compare(loginPassword, userPassword);
}

export async function encryptPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export function getJwtTokenForUser(user: User): string {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TIME_TO_LIVE,
  });
}

function sendLoginResponseWithToken(response: Response, user: User) {
  const token = getJwtTokenForUser(user);
  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_TIME_TO_LIVE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };

  response.status(200).cookie('token', token, options).json({
    success: true,
    token: token,
  });
}
