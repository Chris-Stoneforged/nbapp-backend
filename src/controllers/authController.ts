import { Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { Role, User } from '@prisma/client';
import bcrypt, { hash } from 'bcryptjs';
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

export async function login(
  request: Request,
  response: Response
): Promise<void> {
  const { email, password } = request.body;
  const hashedPassword = await encryptPassword(password);
  console.log(hashedPassword);

  const user = await prismaClient.user.findFirst({
    where: { email: email },
  });

  if (!user) {
    response.status(401).json({
      success: false,
      message: 'Incorrect email or password',
    });
    return;
  }

  const passwordMatch = await comparePasswords(user.password, password);
  if (!passwordMatch) {
    response.status(401).json({
      success: false,
      message: 'Incorrect email or password',
    });
    return;
  }

  const token = getJwtTokenForUser(user);

  response.status(200).json({
    success: true,
    message: 'Successfully logged in',
    token: token,
  });
}

async function comparePasswords(
  userPassword: string,
  loginPassword: string
): Promise<boolean> {
  return await bcrypt.compare(loginPassword, userPassword);
}

async function encryptPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

function getJwtTokenForUser(user: User): string {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TIME_TO_LIVE,
  });
}
