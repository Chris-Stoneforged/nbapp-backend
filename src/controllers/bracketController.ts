import { Request, Response, NextFunction } from 'express';
import prismaClient from '../prismaClient';
import ServerError from '../serverError';
import { BracketData, MatchupData } from '../bracketData';

export async function getNextPredictionToMake(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const bracket = await prismaClient.bracket.findFirst();
  if (!bracket) {
    response.status(200).json({
      success: true,
      message: 'No predictions to make - bracket not set',
      data: null,
    });
    return;
  }

  const bracketData = bracket.bracket_data as BracketData;

  const existingPredictions = await prismaClient.prediction.findMany({
    where: { user_id: request.user.id },
  });

  const remainingPredictions = bracketData.matchups
    .filter(
      (matchup) =>
        matchup.team_a != null &&
        matchup.team_b != null &&
        !existingPredictions.some(
          (prediction) => prediction.matchup_id === matchup.id
        )
    )
    .sort(sortMatchup);

  if (remainingPredictions.length === 0) {
    response.status(200).json({
      success: true,
      messsage: 'No predictions to make',
      data: null,
    });
    return;
  }

  const nextPrediction = remainingPredictions[0];

  console.log(remainingPredictions);
  response.status(200).json({
    success: true,
    data: {
      matchup_id: nextPrediction.id,
      team_a: nextPrediction.team_a,
      team_b: nextPrediction.team_b,
    },
  });
}

function sortMatchup(a: MatchupData, b: MatchupData): number {
  if (a.round < b.round) {
    return -1;
  } else if (a.round > b.round) {
    return 1;
  }

  return 0;
}

export async function makePrediction(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const matchupId = request.body.matchup;
  const predictedWinner = request.body.predictedWinner;

  const bracket = await prismaClient.bracket.findFirst();
  const bracketData = bracket.bracket_data as BracketData;

  const currentPrediction = bracketData.matchups.find(
    (matchup) => matchup.id === matchupId
  );
  if (!currentPrediction) {
    return next(
      new ServerError(400, 'Invalid prediction - missing prediction Id')
    );
  }

  if (
    predictedWinner !== currentPrediction.team_a &&
    predictedWinner !== currentPrediction.team_b
  ) {
    return next(
      new ServerError(400, 'Invalid prediction - invalid winner picked')
    );
  }

  const existingPrediction = await prismaClient.prediction.findFirst({
    where: { user_id: request.user.id, matchup_id: matchupId },
  });

  if (existingPrediction) {
    return next(
      new ServerError(
        400,
        'Invalid prediction - already made prediction for match up'
      )
    );
  }

  await prismaClient.prediction.create({
    data: {
      user_id: request.user.id,
      matchup_id: matchupId,
      winner: predictedWinner,
    },
  });

  response.status(200).json({
    success: true,
    message: 'Successfully made prediction',
  });
}
