import { CreateInviteToken } from 'src/controllers/tournamentController';
import {
  encryptPassword,
  getJwtTokenForUser,
} from '../controllers/authController';
import prismaClient from '../prismaClient';
import { Bracket, Tournament, User } from '@prisma/client';

export async function createTestUser(
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
      role: 'User',
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
  const [code, expiry] = CreateInviteToken(user, tournament, timeToLive);

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
