import { Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { BadRequestError } from '../errors/serverError';
import { createInviteToken } from '../utils/utils';
import { calculateUserScore } from '../utils/scoreCalculator';

export async function createTournament(request: Request, response: Response) {
  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });

  if (!bracket) {
    throw new BadRequestError('Cannot create tournament, invalid bracket');
  }

  const existingTournament = await prismaClient.tournament.findFirst({
    where: {
      users: {
        some: {
          id: request.user.id,
        },
      },
      bracket_id: request.body.bracketId,
    },
  });

  if (existingTournament) {
    throw new BadRequestError(
      'User is already in a tournament for this bracket'
    );
  }

  const tournament = await prismaClient.tournament.create({
    data: {
      bracket_id: bracket.id,
    },
  });

  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournaments: {
        connect: {
          id: tournament.id,
        },
      },
    },
  });

  const memberData = [
    {
      id: request.user.id,
      nickname: request.user.nickname,
      score: 0,
    },
  ];

  response.status(200).json({
    success: true,
    message: 'Successfully created tournament',
    data: {
      tournamentId: tournament.id,
      bracketName: bracket.bracket_name,
      memberData: memberData,
    },
  });
}

export async function leaveTournament(request: Request, response: Response) {
  const tournamentId = Number.parseInt(request.params.id);
  if (Number.isNaN(tournamentId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      users: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    throw new BadRequestError('Could not find tournament with specified Id');
  }

  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournaments: {
        disconnect: {
          id: tournament.id,
        },
      },
    },
  });

  await prismaClient.tournament.delete({
    where: {
      id: tournament.id,
      users: {
        none: {},
      },
    },
  });

  response.status(200).json({
    success: true,
    message: 'Successfully left tournaments',
  });
}

export async function getInviteCodeInfo(request: Request, response: Response) {
  const code = request.params.code;
  const inviteToken = await prismaClient.inviteToken.findFirst({
    where: {
      code: code,
    },
  });

  if (!inviteToken) {
    throw new BadRequestError('Invalid invite code');
  }

  if (inviteToken.expiry <= new Date(Date.now())) {
    await prismaClient.inviteToken.delete({
      where: {
        id: {
          sender_id: inviteToken.sender_id,
          tournament_id: inviteToken.tournament_id,
        },
      },
    });
    throw new BadRequestError('Invite code expired!');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: inviteToken.tournament_id,
    },
    include: { users: true, bracket: true },
  });

  if (!tournament) {
    throw new BadRequestError('Invalid invite code');
  }

  if (tournament.users.some((user) => user.id === request.user.id)) {
    throw new BadRequestError('User is already in this team');
  }

  response.status(200).json({
    success: true,
    data: {
      code: code,
      sender: inviteToken.sender_id,
      bracketName: tournament.bracket.bracket_name,
    },
  });
}

export async function joinTournament(request: Request, response: Response) {
  const code = request.params.code;
  const inviteToken = await prismaClient.inviteToken.findFirst({
    where: {
      code: code,
    },
  });

  if (!inviteToken) {
    throw new BadRequestError('Invalid invite code');
  }

  if (inviteToken.expiry <= new Date(Date.now())) {
    await prismaClient.inviteToken.delete({
      where: {
        id: {
          sender_id: inviteToken.sender_id,
          tournament_id: inviteToken.tournament_id,
        },
      },
    });
    throw new BadRequestError('Invite code expired!');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: inviteToken.tournament_id,
    },
    include: {
      users: {
        include: {
          predictions: true,
        },
      },
      bracket: true,
    },
  });

  if (!tournament) {
    throw new BadRequestError('Invalid invite code');
  }

  if (tournament.users.some((user) => user.id === request.user.id)) {
    throw new BadRequestError('User is already in this team');
  }

  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournaments: {
        connect: {
          id: tournament.id,
        },
      },
    },
  });

  const memberData = tournament.users.map((member) => {
    const userScore = calculateUserScore(member);
    return { id: member.id, nickname: member.nickname, score: userScore };
  });

  memberData.push({
    id: request.user.id,
    nickname: request.user.nickname,
    score: 0,
  });

  response.status(200).json({
    success: true,
    message: 'Successfully joined team',
    data: {
      tournamentId: tournament.id,
      bracketName: tournament.bracket.bracket_name,
      memberData: memberData,
    },
  });
}

export async function getUsersTournaments(
  request: Request,
  response: Response
) {
  const userWithTournaments = await prismaClient.user.findFirst({
    where: {
      id: request.user.id,
    },
    include: {
      tournaments: {
        include: {
          bracket: true,
        },
      },
    },
  });

  const tournamentData = userWithTournaments.tournaments.map((tournament) => {
    return {
      tournamentId: tournament.id,
      bracketName: tournament.bracket.bracket_name,
    };
  });

  response.status(200).json({
    success: true,
    data: tournamentData,
  });
}

export async function getTournamentDetails(
  request: Request,
  response: Response
) {
  const tournamentId = Number.parseInt(request.params.id);
  if (Number.isNaN(tournamentId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      users: true,
      bracket: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    throw new BadRequestError(
      `User is not in tournament with id ${request.body.tournamentId}`
    );
  }

  const memberData = tournament.users.map((member) => {
    const userScore = calculateUserScore(member);
    return { id: member.id, nickname: member.nickname, score: userScore };
  });

  response.status(200).json({
    success: true,
    data: {
      tournamentId: tournament.id,
      bracketName: tournament.bracket.bracket_name,
      memberData: memberData,
    },
  });
}

export async function getTournamentInviteCode(
  request: Request,
  response: Response
) {
  const tournamentId = Number.parseInt(request.params.id);
  if (Number.isNaN(tournamentId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: { id: tournamentId },
    include: {
      users: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    throw new BadRequestError(
      `User is not in tournament with id ${request.body.tournamentId}`
    );
  }

  const [code, expiry] = createInviteToken(
    request.user,
    tournament,
    Number(process.env.INVITE_TOKEN_TIME_TO_LIVE_MILLIS)
  );

  await prismaClient.inviteToken.upsert({
    where: {
      id: {
        sender_id: request.user.id,
        tournament_id: tournament.id,
      },
    },
    update: {
      expiry: expiry,
      code: code,
    },
    create: {
      tournament_id: tournament.id,
      sender_id: request.user.id,
      expiry: expiry,
      code: code,
    },
  });

  response.status(200).json({
    success: true,
    message: 'Generated invite token',
    data: code,
  });
}
