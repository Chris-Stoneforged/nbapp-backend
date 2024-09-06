import { Request, Response, NextFunction } from 'express';
import prismaClient from '../prismaClient';
import ServerError from '../errors/serverError';
import crypto from 'crypto';
import { Tournament, User } from '@prisma/client';

export async function createTournament(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });

  if (!bracket) {
    return next(
      new ServerError(400, 'Cannot create tournament, invalid bracket')
    );
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
    return next(
      new ServerError(400, 'User is already in a tournament for this bracket')
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

  response.status(200).json({
    success: true,
    message: 'Successfully created tournament',
    data: {
      tournamentId: tournament.id,
      bracketName: bracket.bracket_name,
    },
  });
}

export async function leaveTournament(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: request.body.tournamentId ?? 0,
    },
    include: {
      users: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    return next(
      new ServerError(400, 'Could not find tournament with specified Id')
    );
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

  // If no users remain in the tournament, delete it
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

export async function joinTournament(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const code = request.params.code;
  const inviteToken = await prismaClient.inviteToken.findFirst({
    where: {
      code: code,
    },
  });

  if (!inviteToken) {
    return next(new ServerError(400, 'Invalid invite code'));
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
    return next(new ServerError(400, 'Invite code expired!'));
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: inviteToken.tournament_id,
    },
    include: { users: true, bracket: true },
  });

  if (!tournament) {
    return next(new ServerError(400, 'Invalid invite code'));
  }

  if (tournament.users.some((user) => user.id === request.user.id)) {
    return next(new ServerError(400, 'User is already in this team'));
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

  response.status(200).json({
    success: true,
    message: 'Successfully joined team',
    data: {
      tournamentId: tournament.id,
      bracketName: tournament.bracket.bracket_name,
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

export async function getTeamMembers(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const tournament = await prismaClient.tournament.findFirst({
    where: {
      id: request.body.tournamentId,
    },
    include: {
      users: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    return next(
      new ServerError(
        400,
        `User is not in tournament with id ${request.body.tournamentId}`
      )
    );
  }

  const memberData = tournament.users.map((member) => {
    return { id: member.id, nickname: member.nickname };
  });

  response.status(200).json({
    success: true,
    data: memberData,
  });
}

export async function getTournamentInviteCode(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const tournament = await prismaClient.tournament.findFirst({
    where: { id: request.body.tournamentId ?? 0 },
    include: {
      users: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    return next(
      new ServerError(
        400,
        `User is not in tournament with id ${request.body.tournamentId}`
      )
    );
  }

  const [code, expiry] = CreateInviteToken(
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

export function CreateInviteToken(
  user: User,
  tournament: Tournament,
  timeToLive: number
): [string, Date] {
  const expiry = new Date(Date.now() + timeToLive);
  const string = `${tournament.id}${user.id}${expiry}`;
  const code = crypto.createHash('sha256').update(string).digest('hex');
  return [code, expiry];
}
