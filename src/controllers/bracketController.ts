import { Request, Response, NextFunction } from 'express';
import prismaClient from '../prismaClient';
import ServerError from '../serverError';
import { BracketData, MatchupData, MatchupState } from '../bracketData';
import { User } from '@prisma/client';

// Admin route
export async function udpateBracket(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  // TODO - validate this cast (using zod?)
  const bracket = request.body.bracketJson as BracketData;

  if (!bracket) {
    return next(new ServerError(400, 'error parsing bracket JSON.'));
  }

  await prismaClient.bracket.upsert({
    where: { id: 1 },
    create: { bracket_data: bracket },
    update: { bracket_data: bracket },
  });

  response
    .status(200)
    .json({ success: true, message: 'Successfully updated bracket data.' });

  // TODO: Introduce validation for correct number of rounds, no dead ends, valid number of matchups, etc.
}

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
        matchup.round === 1 &&
        matchup.teamA != null &&
        matchup.teamB != null &&
        !existingPredictions.some(
          (prediction) => prediction.matchup_id === matchup.id
        )
    )
    .sort(sortMatchup);

  if (remainingPredictions.length > 0) {
    const nextPrediction = remainingPredictions[0];

    response.status(200).json({
      success: true,
      data: {
        matchupId: nextPrediction.id,
        round: nextPrediction.round,
        teamA: nextPrediction.teamA,
        teamB: nextPrediction.teamB,
      },
    });
    return;
  }

  for (const prediction of existingPredictions) {
    const predictedMatchup = bracketData.matchups.find(
      (matchup) => matchup.id == prediction.matchup_id
    );

    if (
      existingPredictions.some(
        (prediction) => prediction.matchup_id === predictedMatchup.advancesTo
      )
    ) {
      continue;
    }

    const otherMatchup = bracketData.matchups.find(
      (matchup) =>
        matchup.advancesTo === predictedMatchup.advancesTo &&
        matchup.id !== predictedMatchup.id
    );
    if (!otherMatchup) {
      continue;
    }

    const otherPrediction = existingPredictions.find(
      (prediction) => prediction.matchup_id === otherMatchup.id
    );
    if (!otherPrediction) {
      continue;
    }

    response.status(200).json({
      success: true,
      data: {
        matchupId: predictedMatchup.advancesTo,
        round: predictedMatchup.round + 1,
        teamA: prediction.winner,
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

export async function makePrediction(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const matchupId = request.body.matchup;
  const predictedWinner = request.body.predictedWinner;

  const bracket = await prismaClient.bracket.findFirst();
  if (!bracket) {
    return next(
      new ServerError(500, 'Cannot make prediction - No bracket set')
    );
  }

  const bracketData = bracket.bracket_data as BracketData;

  const currentPrediction = bracketData.matchups.find(
    (matchup) => matchup.id === matchupId
  );
  if (!currentPrediction) {
    return next(new ServerError(400, 'Invalid prediction Id'));
  }

  const existingPrediction = await prismaClient.prediction.findFirst({
    where: { user_id: request.user.id, matchup_id: matchupId },
  });

  if (existingPrediction) {
    return next(new ServerError(400, 'Already made prediction for match up'));
  }

  if (
    currentPrediction.round === 1 &&
    predictedWinner !== currentPrediction.teamA &&
    predictedWinner !== currentPrediction.teamB
  ) {
    return next(
      new ServerError(400, 'Invalid prediction - invalid winner picked')
    );
  }

  if (currentPrediction.round > 1) {
    const previousMatchups = bracketData.matchups.filter(
      (matchup) => matchup.advancesTo === matchupId
    );

    const previousPredections = await prismaClient.prediction.findMany({
      where: { user_id: request.user.id },
    });

    const parentPredictions = previousPredections.filter((prediction) =>
      previousMatchups.some((matchup) => matchup.id == prediction.matchup_id)
    );

    if (parentPredictions.length !== 2) {
      return next(
        new ServerError(
          400,
          'Invalid prediction - previous predictions not made'
        )
      );
    }

    if (
      predictedWinner !== parentPredictions[0].winner &&
      predictedWinner !== parentPredictions[1].winner
    ) {
      return next(
        new ServerError(400, 'Invalid prediction - invalid winner picked')
      );
    }
  }

  await prismaClient.prediction.create({
    data: {
      user_id: request.user.id,
      matchup_id: matchupId,
      winner: predictedWinner,
    },
  });

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    request.user,
    bracketData
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
  response: Response,
  next: NextFunction
) {
  const user: User =
    request.body.user_id === undefined
      ? request.user
      : await prismaClient.user.findFirst({
          where: { id: request.body.user_id },
        });

  if (!user) {
    return next(new ServerError(400, 'Cannot retrieve state - Invalid user'));
  }

  const bracket = await prismaClient.bracket.findFirst();
  if (!bracket) {
    return next(new ServerError(500, 'Cannot retrieve state - No bracket set'));
  }

  const bracketData = bracket.bracket_data as BracketData;
  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    user,
    bracketData
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
  bracketData: BracketData
): Promise<[MatchupState[], number]> {
  const userPredictions = await prismaClient.prediction.findMany({
    where: { user_id: user.id },
  });

  const finalsMatchup = bracketData.matchups.find(
    (matchup) => matchup.advancesTo == null
  );

  const matchupData = bracketData.matchups.map((matchup) => {
    const userPrediction = userPredictions.find(
      (prediction) => prediction.matchup_id === matchup.id
    );
    return {
      ...matchup,
      predictedWinner: userPrediction?.winner,
    };
  });

  return [matchupData, finalsMatchup.id];
}

function sortMatchup(a: MatchupData, b: MatchupData): number {
  if (a.round < b.round) {
    return -1;
  } else if (a.round > b.round) {
    return 1;
  }

  return 0;
}
