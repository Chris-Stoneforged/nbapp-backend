import { Request, Response } from 'express';
import prismaClient from '../prismaClient';
import { BadRequestError } from '../errors/serverError';
import { BracketData, MatchupState } from '../utils/bracketData';
import { User } from '@prisma/client';
import validateBracketJson from '../utils/bracketValidator';

// Admin route
export async function udpateBracket(
  request: Request,
  response: Response
): Promise<void> {
  const bracketData = request.body.bracketJson as BracketData;
  if (!bracketData) {
    throw new BadRequestError('Error parsing bracket JSON.');
  }

  const [isValid, message] = validateBracketJson(bracketData);
  if (!isValid) {
    throw new BadRequestError(`Bad bracket data - ${message}`);
  }

  const bracket = await prismaClient.bracket.upsert({
    where: { id: bracketData.bracketId },
    update: { bracket_name: bracketData.bracketName },
    create: {
      id: bracketData.bracketId,
      bracket_name: bracketData.bracketName,
    },
  });

  // would be better to bulk delete and create again, but we can't do
  // that here since prediction model has relation to matchup
  for (const matchup of bracketData.matchups) {
    await prismaClient.matchup.upsert({
      where: {
        id_bracket_id: {
          id: matchup.id,
          bracket_id: bracket.id,
        },
      },
      create: {
        id: matchup.id,
        bracket_id: bracket.id,
        ...matchup,
      },
      update: {
        ...matchup,
      },
    });
  }

  response
    .status(200)
    .json({ success: true, message: 'Successfully updated bracket data.' });
}

export async function getAvailableBrackets(
  request: Request,
  response: Response
) {
  const brackets = await prismaClient.bracket.findMany();
  response.status(200).json({
    success: true,
    data: brackets,
  });
}

export async function getNextPredictionToMake(
  request: Request,
  response: Response
) {
  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });
  if (!bracket) {
    response.status(200).json({
      success: true,
      message: 'No predictions to make - bracket not set',
      data: null,
    });
    return;
  }

  const nextRemainingRoundOnePrediction = await prismaClient.matchup.findFirst({
    where: {
      AND: [
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

  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });
  if (!bracket) {
    throw new BadRequestError('Cannot make prediction - Invalid bracket id');
  }

  const userPredictions = await prismaClient.prediction.findMany({
    where: { user_id: request.user.id },
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
      bracket_id: bracket.id,
      matchup_id: matchupId,
      winner: predictedWinner,
    },
  });

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    request.user,
    bracket.id
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
  const bracketId = Number.parseInt(request.params.id);
  if (Number.isNaN(bracketId)) {
    throw new BadRequestError('Invalid tournament Id');
  }

  const bracket = await prismaClient.bracket.findFirst({
    where: { id: bracketId },
  });
  if (!bracket) {
    throw new BadRequestError(
      `Cannot retrieve state - No bracket with id ${request.body.bracketId} set`
    );
  }

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    request.user,
    bracket.id
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
  user: User,
  bracketId: number
): Promise<[MatchupState[], number]> {
  const matchups = await prismaClient.matchup.findMany({
    where: { bracket_id: bracketId },
    include: {
      predictions: {
        where: {
          user_id: user.id,
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
