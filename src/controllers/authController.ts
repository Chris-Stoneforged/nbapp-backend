import prismaClient from '../prismaClient';
import { Request, Response } from 'express';
import { Role, User } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from '../errors/serverError';
import {
  comparePasswords,
  encryptPassword,
  getCookieData,
} from '../utils/authUtils';

export async function register(
  request: Request,
  response: Response
): Promise<void> {
  const { email, nickname, password } = request.body;
  if (!email || !nickname || !password) {
    throw new BadRequestError('Missing required information');
  }

  const existingUser = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (existingUser) {
    throw new BadRequestError('Email is already in use');
  }

  const hashedPassword = await encryptPassword(password);
  const user: User = await prismaClient.user.create({
    data: {
      email: email,
      nickname: nickname,
      role: Role.User,
      password: hashedPassword,
    },
  });

  const [token, options] = getCookieData(user);
  response.status(200).cookie('token', token, options).json({
    success: true,
    token: token,
  });
}

export async function login(
  request: Request,
  response: Response
): Promise<void> {
  const { email, password } = request.body;

  const user = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (!user) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  const passwordMatch = await comparePasswords(user.password, password);
  if (!passwordMatch) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  const [token, options] = getCookieData(user);
  response.status(200).cookie('token', token, options).json({
    success: true,
    token: token,
  });
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
