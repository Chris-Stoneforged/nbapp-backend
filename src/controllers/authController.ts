import { Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function register(
  request: Request,
  response: Response
): Promise<void> {
  const { email, nickname, password } = request.body;

  // Make sure email is unique
  const existingUser = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (existingUser) {
    response
      .status(400)
      .json({ success: false, message: 'Email is already in use!' });
    return;
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

  const token = getJwtTokenForUser(user);

  response.status(200).json({
    success: true,
    message: 'User was successfully created',
    token: token,
  });
}

async function encryptPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function login(
  request: Request,
  response: Response
): Promise<void> {
  const { email, password } = request.body;

  const user = prismaClient.user.findFirst({ where: { email } });
}

function getJwtTokenForUser(user: User): string {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TIME_TO_LIVE,
  });
}
