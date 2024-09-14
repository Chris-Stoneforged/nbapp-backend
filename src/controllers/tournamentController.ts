import { Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { BadRequestError } from '../errors/serverError';
import { createInviteToken } from '../utils/utils';
import { calculateUserScore } from '../utils/scoreCalculator';
import { MatchupState } from '../utils/bracketData';

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
    include: {
      sender: true,
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
      sender: inviteToken.sender.nickname,
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
          predictions: {
            include: {
              matchup: true,
            },
          },
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
      users: {
        include: {
          predictions: {
            include: {
              matchup: true,
            },
          },
        },
      },
      bracket: true,
    },
  });

  if (
    !tournament ||
    !tournament.users.some((user) => user.id === request.user.id)
  ) {
    throw new BadRequestError(
      `User is not in tournament with id ${request.params.id}`
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

export async function getNextPredictionToMake(
  request: Request,
  response: Response
) {
  const tournamentId = Number.parseInt(request.params.id);
  if (Number.isNaN(tournamentId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: { id: tournamentId },
    include: { bracket: true },
  });

  if (!tournament) {
    throw new BadRequestError(
      `User is not in tournament with id ${tournamentId}`
    );
  }

  const nextRemainingRoundOnePrediction = await prismaClient.matchup.findFirst({
    where: {
      AND: [
        { bracket_id: tournament.bracket_id },
        { round: 1 },
        { winner: null },
        {
          predictions: {
            none: {
              user_id: request.user.id,
            },
          },
        },
      ],
    },
  });

  if (nextRemainingRoundOnePrediction) {
    response.status(200).json({
      success: true,
      data: {
        matchupId: nextRemainingRoundOnePrediction.id,
        round: nextRemainingRoundOnePrediction.round,
        teamA: nextRemainingRoundOnePrediction.team_a,
        teamB: nextRemainingRoundOnePrediction.team_b,
      },
    });
    return;
  }

  const existingPredictions = await prismaClient.prediction.findMany({
    where: {
      user_id: request.user.id,
      tournament_id: tournament.id,
    },
    include: {
      matchup: true,
    },
  });

  for (const existingPrediction of existingPredictions) {
    // If there's already been a prediction for the existingPrediction's next match (advances_to)
    if (
      existingPredictions.some(
        (prediction) =>
          prediction.matchup_id === existingPrediction.matchup.advances_to
      )
    ) {
      continue;
    }

    const otherPrediction = existingPredictions.find(
      (prediction) =>
        prediction.matchup.advances_to ===
          existingPrediction.matchup.advances_to &&
        prediction.matchup_id !== existingPrediction.matchup_id
    );
    if (!otherPrediction) {
      continue;
    }

    const nextPrediction = await prismaClient.matchup.findFirst({
      where: { id: existingPrediction.matchup.advances_to },
    });
    if (nextPrediction.winner) {
      continue;
    }

    response.status(200).json({
      success: true,
      data: {
        matchupId: existingPrediction.matchup.advances_to,
        round: existingPrediction.matchup.round + 1,
        teamA: existingPrediction.winner,
        teamB: otherPrediction.winner,
      },
    });
    return;
  }

  response.status(200).json({
    success: true,
    messsage: 'No predictions to make',
    data: null,
  });
  return;
}

export async function makePrediction(request: Request, response: Response) {
  const matchupId: number = request.body.matchup;
  const predictedWinner = request.body.predictedWinner;

  const tournamentId = Number.parseInt(request.params.id);
  if (Number.isNaN(tournamentId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const tournament = await prismaClient.tournament.findFirst({
    where: { id: tournamentId },
    include: { bracket: true },
  });

  if (!tournament) {
    throw new BadRequestError(
      `User is not in tournament with id ${tournamentId}`
    );
  }

  const userPredictions = await prismaClient.prediction.findMany({
    where: {
      user_id: request.user.id,
      tournament_id: tournamentId,
    },
    include: { matchup: true },
  });

  if (
    userPredictions.some((prediction) => prediction.matchup_id === matchupId)
  ) {
    throw new BadRequestError('Already made prediction for match up');
  }

  const predictedMatchup = await prismaClient.matchup.findFirst({
    where: { id: matchupId },
  });
  if (!predictedMatchup) {
    throw new BadRequestError('Invalid prediction Id');
  }

  if (predictedMatchup.winner) {
    throw new BadRequestError('Matchup is already decided');
  }

  if (
    predictedMatchup.round === 1 &&
    predictedWinner !== predictedMatchup.team_a &&
    predictedWinner !== predictedMatchup.team_b
  ) {
    throw new BadRequestError('Invalid prediction - invalid winner picked');
  }

  if (predictedMatchup.round > 1) {
    const parentPredictions = userPredictions.filter(
      (prediction) => prediction.matchup.advances_to === matchupId
    );

    if (parentPredictions.length !== 2) {
      throw new BadRequestError(
        'Invalid prediction - previous predictions not made'
      );
    }

    if (
      predictedWinner !== parentPredictions[0].winner &&
      predictedWinner !== parentPredictions[1].winner
    ) {
      throw new BadRequestError('Invalid prediction - invalid winner picked');
    }
  }

  await prismaClient.prediction.create({
    data: {
      user_id: request.user.id,
      bracket_id: tournament.bracket_id,
      matchup_id: matchupId,
      tournament_id: tournament.id,
      winner: predictedWinner,
    },
  });

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    request.body.userId ?? request.user.id,
    tournament.bracket_id
  );

  response.status(200).json({
    success: true,
    message: 'Successfully made prediction',
    data: {
      matchups: matchupData,
      root_matchup_id: finalsMatchupId,
    },
  });
}

export async function getBracketStateForUser(
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
      bracket: true,
      users: true,
    },
  });

  if (!tournament) {
    throw new BadRequestError(
      `User is not in tournament with id ${tournamentId}`
    );
  }

  const userId = request.body.userId ?? request.user.id;
  if (!tournament.users.some((user) => user.id === userId)) {
    throw new BadRequestError(
      `User with id ${userId} is not in your tournament`
    );
  }

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    request.body.userId ?? request.user.id,
    tournament.bracket_id
  );

  response.status(200).json({
    success: true,
    data: {
      matchups: matchupData,
      root_matchup_id: finalsMatchupId,
    },
  });
}

async function getBracketStateResponse(
  userId: number,
  bracketId: number
): Promise<[MatchupState[], number]> {
  const matchups = await prismaClient.matchup.findMany({
    where: { bracket_id: bracketId },
    include: {
      predictions: {
        where: {
          user_id: userId,
        },
      },
    },
  });

  const matchupData = matchups.map((matchup) => {
    const parentMatchups = matchups.filter(
      (match) => match.advances_to === matchup.id
    );

    const result: MatchupState = {
      id: matchup.id,
      round: matchup.round,
      team_a: matchup.team_a ?? parentMatchups[0].predictions[0]?.winner,
      team_b: matchup.team_b ?? parentMatchups[1].predictions[0]?.winner,
    };
    if (matchup.predictions.length > 0) {
      result.predictedWinner = matchup.predictions[0].winner;
    }
    if (matchup.winner !== null) {
      result.winner = matchup.winner;
    }

    return result;
  });

  const finalsMatchup = matchups.find((matchup) => matchup.advances_to == null);
  return [matchupData, finalsMatchup.id];
}
