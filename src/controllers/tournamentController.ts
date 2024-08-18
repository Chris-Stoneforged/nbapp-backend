import { Request, Response, NextFunction } from 'express';
import prismaClient from '../prismaClient';
import ServerError from '../serverError';
import crypto from 'crypto';

export async function createTournament(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (request.user.tournament_id) {
    return next(
      new ServerError(
        400,
        'Cannot create tournament - user is already in a tournament'
      )
    );
  }

  // Create tournament
  const tournament = await prismaClient.tournament.create({
    data: { bracket_id: request.body.bracketId },
  });

  // Assign user to tournament
  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournament_id: tournament.id,
    },
  });

  response.status(200).json({
    success: true,
    message: 'Successfully created tournament',
  });
}

export async function leaveTournament(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (!request.user.tournament_id) {
    return next(
      new ServerError(
        400,
        'Cannot leave tournament - user is not in a tournament'
      )
    );
  }

  const tournamentId = request.user.tournament_id;

  // Remove tournament id from user
  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournament_id: null,
    },
  });

  // Find how many users are remaining in the tournament
  const tournamentCount = await prismaClient.user.count({
    where: {
      tournament_id: tournamentId,
    },
  });

  // If no users remain in the tournament, delete it
  if (tournamentCount === 0) {
    await prismaClient.tournament.delete({
      where: {
        id: tournamentId,
      },
    });
  }

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
  if (request.user.tournament_id) {
    return next(
      new ServerError(400, 'Cannot join team - user is already in a team')
    );
  }

  const code = request.params.code;
  const inviteToken = await prismaClient.inviteToken.findFirst({
    where: {
      code: code,
    },
  });

  if (!inviteToken) {
    return next(new ServerError(400, 'Invalid invite token'));
  }

  // Check token is not expired
  if (inviteToken.expiry <= new Date(Date.now())) {
    await prismaClient.inviteToken.delete({ where: { id: inviteToken.id } });
    return next(new ServerError(400, 'Invite token expired!'));
  }

  await prismaClient.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      tournament_id: inviteToken.tournament_id,
    },
  });

  response.status(200).json({
    success: true,
    message: 'Successfully joined team',
  });
}

export async function getTeamMembers(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (!request.user.tournament_id) {
    return next(new ServerError(400, 'User is not part of a tournament'));
  }

  const teamMembers = await prismaClient.user.findMany({
    where: { tournament_id: request.user.tournament_id },
  });

  const memberData = teamMembers.map((member) => {
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
  if (!request.user.tournament_id) {
    return next(
      new ServerError(
        400,
        'Cannot get invite code - user is not part of a tournament'
      )
    );
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: { id: request.user.tournament_id },
  });

  if (!tournament) {
    return next(
      new ServerError(
        400,
        'Cannot get invite code - user is not part of a tournament'
      )
    );
  }

  // TODO: return existing invite code if it's still valid.

  const expiry = new Date(
    Date.now() + Number(process.env.INVITE_TOKEN_TIME_TO_LIVE_MILLIS)
  );
  const string = `${tournament.id}${request.user.id}${expiry}`;
  const code = crypto.createHash('sha256').update(string).digest('hex');

  // Create new token
  await prismaClient.inviteToken.create({
    data: {
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
