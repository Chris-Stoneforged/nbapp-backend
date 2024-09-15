import prismaClient from '../prismaClient';
import { encryptPassword, getJwtTokenForUser } from '../utils/authUtils';
import { Bracket, Prisma, Tournament, User } from '@prisma/client';
import { createInviteToken } from '../utils/utils';

import { exec } from 'child_process';
import * as util from 'util';

const execPromisify = util.promisify(exec);

export async function createTestUser(
  isAdmin = false,
  password?: string
): Promise<[User, string]> {
  const seed = new Date(Date.now()).getMilliseconds().toString();
  const email = `${seed}@gmail.com`;
  password = password || seed;
  const nickname = seed;

  const hashedPassword = await encryptPassword(password);
  const user: User = await prismaClient.user.create({
    data: {
      email: email,
      nickname: nickname,
      role: isAdmin ? 'Admin' : 'User',
      password: hashedPassword,
    },
  });
  const token = getJwtTokenForUser(user);
  return [user, token];
}

export async function createTestBracket(bracketName: string) {
  return await prismaClient.bracket.create({
    data: {
      bracket_name: bracketName,
    },
  });
}

export async function userJoinTournament(
  user: User,
  tournament: Tournament
): Promise<User> {
  return await prismaClient.user.update({
    where: { id: user.id },
    data: { tournaments: { connect: { id: tournament.id } } },
    include: { tournaments: true },
  });
}

export async function createTestTournament(
  bracket?: Bracket
): Promise<[Tournament, Bracket]> {
  if (!bracket) {
    bracket = await prismaClient.bracket.create({
      data: { bracket_name: 'test' },
    });
  }

  const tournament = await prismaClient.tournament.create({
    data: { bracket_id: bracket.id },
  });
  return [tournament, bracket];
}

export async function leaveTestTournament(
  user: User,
  tournamentId: number
): Promise<void> {
  await prismaClient.user.update({
    where: {
      id: user.id,
    },
    data: {
      tournaments: {
        disconnect: {
          id: tournamentId,
        },
      },
    },
  });
}

export async function getTestInviteCode(
  user: User,
  tournament: Tournament,
  timeToLive: number
): Promise<string> {
  const [code, expiry] = createInviteToken(user, tournament, timeToLive);

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

export async function resetDatabase() {
  await execPromisify(
    'dotenv -e .env.test -- npx prisma migrate reset --force --skip-seed'
  );
}
