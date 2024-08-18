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
  // TODO: Introduce validation for correct number of rounds, no dead ends, valid number of matchups, etc.
  const bracketData = request.body.bracketJson as BracketData;
  console.log(bracketData);
  if (!bracketData) {
    return next(new ServerError(400, 'error parsing bracket JSON.'));
  }

  const bracket = await prismaClient.bracket.upsert({
    where: { bracket_name: bracketData.bracketName },
    update: {},
    create: { bracket_name: bracketData.bracketName },
  });

  await prismaClient.matchup.deleteMany({ where: { bracket_id: bracket.id } });
  await prismaClient.matchup.createMany({
    data: bracketData.matchups.map((matchup) => {
      return {
        bracket_id: bracket.id,
        ...matchup,
      };
    }),
  });

  response
    .status(200)
    .json({ success: true, message: 'Successfully updated bracket data.' });
}

export async function getAvailableBrackets(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const brackets = await prismaClient.bracket.findMany();
  response.status(200).json({
    success: true,
    data: brackets,
  });
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

  const nextRemainingRoundOnePrediction = await prismaClient.matchup.findFirst({
    where: {
      AND: [
        { round: 1 },
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

  // for (const prediction of existingPredictions) {
  //   const predictedMatchup = bracketData.matchups.find(
  //     (matchup) => matchup.id == prediction.matchup_id
  //   );

  //   if (
  //     existingPredictions.some(
  //       (prediction) => prediction.matchup_id === predictedMatchup.advances_to
  //     )
  //   ) {
  //     continue;
  //   }

  //   const otherMatchup = bracketData.matchups.find(
  //     (matchup) =>
  //       matchup.advances_to === predictedMatchup.advances_to &&
  //       matchup.id !== predictedMatchup.id
  //   );
  //   if (!otherMatchup) {
  //     continue;
  //   }

  //   const otherPrediction = existingPredictions.find(
  //     (prediction) => prediction.matchup_id === otherMatchup.id
  //   );
  //   if (!otherPrediction) {
  //     continue;
  //   }

  //   response.status(200).json({
  //     success: true,
  //     data: {
  //       matchupId: predictedMatchup.advances_to,
  //       round: predictedMatchup.round + 1,
  //       teamA: prediction.winner,
  //       teamB: otherPrediction.winner,
  //     },
  //   });
  //   return;
  // }

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
  const matchupId: number = request.body.matchup;
  const predictedWinner = request.body.predictedWinner;

  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });
  if (!bracket) {
    return next(
      new ServerError(500, 'Cannot make prediction - Invalid bracket id')
    );
  }

  const userPredictions = await prismaClient.prediction.findMany({
    where: { user_id: request.user.id },
    include: { matchup: true },
  });

  if (
    userPredictions.some((prediction) => prediction.matchup_id === matchupId)
  ) {
    return next(new ServerError(400, 'Already made prediction for match up'));
  }

  const predictedMatchup = await prismaClient.matchup.findFirst({
    where: { id: matchupId },
  });
  if (!predictedMatchup) {
    return next(new ServerError(400, 'Invalid prediction Id'));
  }

  if (
    predictedMatchup.round === 1 &&
    predictedWinner !== predictedMatchup.team_a &&
    predictedWinner !== predictedMatchup.team_b
  ) {
    return next(
      new ServerError(400, 'Invalid prediction - invalid winner picked')
    );
  }

  if (predictedMatchup.round > 1) {
    const parentPredictions = userPredictions.filter(
      (prediction) => prediction.matchup.advances_to === matchupId
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

  const bracket = await prismaClient.bracket.findFirst({
    where: { id: request.body.bracketId },
  });
  if (!bracket) {
    return next(new ServerError(500, 'Cannot retrieve state - No bracket set'));
  }

  const [matchupData, finalsMatchupId] = await getBracketStateResponse(
    user,
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
    return {
      id: matchup.id,
      round: matchup.round,
      teamA: matchup.team_a,
      teamB: matchup.team_b,
      predictedWinner:
        matchup.predictions.length > 0 ? matchup.predictions[0].winner : null,
    };
  });

  const finalsMatchup = matchups.find((matchup) => matchup.advances_to == null);

  return [matchupData, finalsMatchup.id];
}
