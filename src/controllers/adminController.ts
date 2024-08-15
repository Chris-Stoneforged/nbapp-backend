import { Request, Response, NextFunction } from 'express';
import ServerError from '../serverError';
import prismaClient from '../prismaClient';
import { BracketData } from '../bracketData';

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
    where: { id: 0 },
    create: { bracket_data: bracket },
    update: { bracket_data: bracket },
  });

  response
    .status(200)
    .json({ success: true, message: 'Successfully updated bracket data.' });

  // TODO: Introduce validation for correct number of rounds, no dead ends, valid number of matchups, etc.
}
