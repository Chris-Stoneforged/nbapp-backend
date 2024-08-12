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

export async function createTournamentForUser(email: string) {
  const tournament = await prismaClient.tournament.create({});
  await prismaClient.user.update({
    where: { email: email },
    data: { tournament_id: tournament.id },
  });
}
