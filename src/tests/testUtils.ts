import {
  encryptPassword,
  getJwtTokenForUser,
} from 'src/controllers/authController';
import prismaClient from '../prismaClient';
import { Role, User } from '@prisma/client';

export async function createTestUser(
  nickname: string,
  email: string,
  password: string
): Promise<string> {
  const hashedPassword = await encryptPassword(password);
  const user: User = await prismaClient.user.create({
    data: {
      email: email,
      nickname: nickname,
      role: Role.User,
      password: hashedPassword,
    },
  });
  const token = getJwtTokenForUser(user);
  return token;
}
