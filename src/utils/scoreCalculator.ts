import { Prisma } from '@prisma/client';

type UserWithPredictionsWithMatchups = Prisma.UserGetPayload<{
  include: { predictions: { include: { matchup: true } } };
}>;

export function calculateUserScore(
  user: UserWithPredictionsWithMatchups
): number {
  let score = 0;
  for (const prediction of user.predictions) {
    if (
      prediction.matchup.winner &&
      prediction.winner === prediction.matchup.winner
    ) {
      // 3 points for predicting finals match up
      score += prediction.matchup.advances_to ? 1 : 3;
    }
  }

  return score;
}
