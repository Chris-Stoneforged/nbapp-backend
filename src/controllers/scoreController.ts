import prismaClient from '../prismaClient';
import { Request, Response } from 'express';
import { BadRequestError } from '../errors/serverError';

type ScoreData = {
  scoreId: string;
  value: number;
};

export async function setScoreValue(
  request: Request,
  response: Response
): Promise<void> {
  const scoreData: ScoreData[] = request.body.scores;
  if (!scoreData) {
    throw new BadRequestError('Invalid information provided');
  }

  for (const score of scoreData) {
    await prismaClient.scoreValue.upsert({
      where: { id: score.scoreId },
      update: {
        score: score.value,
      },
      create: {
        id: score.scoreId,
        score: score.value,
      },
    });
  }

  response.status(200).json({
    success: true,
    message: 'Score data has been updated',
  });
}
