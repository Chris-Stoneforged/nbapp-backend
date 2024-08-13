import {
  encryptPassword,
  getJwtTokenForUser,
} from 'src/controllers/authController';
import prismaClient from '../prismaClient';
import { Role, Tournament, User } from '@prisma/client';
import crypto from 'crypto';

export async function createTestUser(
  nickname: string,
  email: string,
  password: string
): Promise<[User, string]> {
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
  return [user, token];
}

export async function createTournamentForUser(user: User): Promise<Tournament> {
  const tournament = await prismaClient.tournament.create({});
  await prismaClient.user.update({
    where: { id: user.id },
    data: { tournament_id: tournament.id },
  });
  return tournament;
}

export async function getInviteCode(
  user: User,
  tournament: Tournament,
  timeToLive: number
): Promise<string> {
  const expiry = new Date(Date.now() + timeToLive);
  const string = `${tournament.id}${user.id}${expiry}`;
  const code = crypto.createHash('sha256').update(string).digest('hex');

  await prismaClient.inviteToken.create({
    data: {
      tournament_id: tournament.id,
      sender_id: user.id,
      expiry: expiry,
      code: code,
    },
  });

  return code;
}
