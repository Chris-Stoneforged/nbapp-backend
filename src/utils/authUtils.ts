import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function getJwtTokenForUser(user: User) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TIME_TO_LIVE,
  });
}

export function getCookieData(user: User): [
  string,
  {
    expires: Date;
    httpOnly: boolean;
    secure: boolean;
  }
] {
  const token = getJwtTokenForUser(user);
  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_TIME_TO_LIVE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };

  return [token, options];
}

export async function comparePasswords(
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
