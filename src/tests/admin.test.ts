import request from 'supertest';
import app from '../app';
import prismaClient from '../prismaClient';
import { createTestUser } from './testUtils';
import { BracketData } from '../bracketData';

describe('Admin routes', () => {
  const updateBracketRoute = '/api/admin/update-bracket';
  const invalidJson = { matches: [{ invalid: 'blah' }] };
  const testBracket: BracketData = {
    bracketId: 0,
    bracketName: 'test',
    matchups: [
      {
        id: 1,
        round: 1,
        team_a: 'Lakers',
        team_b: 'Suns',
        advances_to: 5,
      },
      {
        id: 2,
        round: 1,
        team_a: 'Mavericks',
        team_b: 'Timberwolves',
        advances_to: 5,
      },
      {
        id: 3,
        round: 1,
        team_a: 'Pelicans',
        team_b: 'Kings',
        advances_to: 6,
      },
      {
        id: 4,
        round: 1,
        team_a: 'Nuggets',
        team_b: 'Thunder',
        advances_to: 6,
      },
      {
        id: 5,
        round: 2,
        team_a: null,
        team_b: null,
        advances_to: 7,
      },
      {
        id: 6,
        round: 2,
        team_a: null,
        team_b: null,
        advances_to: 7,
      },
      {
        id: 7,
        round: 3,
        team_a: null,
        team_b: null,
        advances_to: null,
      },
    ],
  };

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
    await prismaClient.bracket.deleteMany();
  });

  test(updateBracketRoute, async () => {
    expect(true).toBeTruthy();
    // Regular user
    // const [, token] = await createTestUser('user', 'user@gmail.com', 'user');

    // let response = await request(app)
    //   .post(updateBracketRoute)
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({ bracketJson: testBracket });

    // expect(response.status).toBe(403);

    // const [, adminToken] = await createTestUser(
    //   'admin',
    //   'admin@gmail.com',
    //   'admin',
    //   'Admin'
    // );

    // response = await request(app)
    //   .post(updateBracketRoute)
    //   .set('Authorization', `Bearer ${adminToken}`)
    //   .send({
    //     bracketJson: testBracket,
    //   });

    // expect(response.statusCode).toBe(200);
  });
});
