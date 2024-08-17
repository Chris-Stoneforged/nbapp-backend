import request from 'supertest';
import app from '../app';
import prismaClient from '../prismaClient';
import { createTestUser } from './testUtils';
import { BracketData } from '../bracketData';

describe('Admin routes', () => {
  const updateBracketRoute = '/api/admin/update-bracket';
  const invalidJson = { matches: [{ invalid: 'blah' }] };
  const testBracket: BracketData = {
    matchups: [
      {
        id: 1,
        round: 1,
        teamA: 'Lakers',
        teamB: 'Suns',
        advancesTo: 5,
      },
      {
        id: 2,
        round: 1,
        teamA: 'Mavericks',
        teamB: 'Timberwolves',
        advancesTo: 5,
      },
      {
        id: 3,
        round: 1,
        teamA: 'Pelicans',
        teamB: 'Kings',
        advancesTo: 6,
      },
      {
        id: 4,
        round: 1,
        teamA: 'Nuggets',
        teamB: 'Thunder',
        advancesTo: 6,
      },
      {
        id: 5,
        round: 2,
        teamA: null,
        teamB: null,
        advancesTo: 7,
      },
      {
        id: 6,
        round: 2,
        teamA: null,
        teamB: null,
        advancesTo: 7,
      },
      {
        id: 7,
        round: 3,
        teamA: null,
        teamB: null,
        advancesTo: null,
      },
    ],
  };

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
    await prismaClient.bracket.deleteMany();
  });

  test(updateBracketRoute, async () => {
    // Regular user
    const [, token] = await createTestUser('user', 'user@gmail.com', 'user');

    let response = await request(app)
      .post(updateBracketRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ bracketJson: testBracket });

    expect(response.status).toBe(403);

    const [, adminToken] = await createTestUser(
      'admin',
      'admin@gmail.com',
      'admin',
      'Admin'
    );

    response = await request(app)
      .post(updateBracketRoute)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bracketJson: testBracket,
      });

    expect(response.statusCode).toBe(200);
    const bracket = await prismaClient.bracket.findFirst();
    expect(bracket.bracket_data).toEqual(testBracket);
  });
});
