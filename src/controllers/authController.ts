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

  sendLoginResponseWithToken(response, user);
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

  sendLoginResponseWithToken(response, user);
}

export async function logout(
  request: Request,
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
