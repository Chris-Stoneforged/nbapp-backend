import request from 'supertest';
import app from '../../app';
import prismaClient from '../../prismaClient';
import { createTestBracket, createTestUser } from '../testUtils';

describe('Bracket routes', () => {
  const setBracketRoute = '/api/v1/bracket/set';
  const deleteBracketRoute = '/api/admin/v1/bracket';
  const bracketsRoute = '/api/v1/brackets';

  test(setBracketRoute, async () => {
    const [, token] = await createTestUser(true);

    let response = await request(app)
      .post(setBracketRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post(setBracketRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({
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
            advances_to: 7,
          },
          {
            id: 6,
            round: 2,
            advances_to: 7,
          },
          {
            id: 7,
            round: 3,
          },
        ],
      });

    expect(response.statusCode).toBe(200);
    let bracketCount = await prismaClient.bracket.count();
    let matchup1 = await prismaClient.matchup.findFirst({
      where: {
        id: 1,
      },
    });
    expect(bracketCount).toBe(1);
    expect(matchup1.team_a).toBe('Lakers');
    expect(matchup1.team_b).toBe('Suns');
    expect(matchup1.winner).toBeUndefined();

    response = await request(app)
      .post(setBracketRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bracketName: 'test',
        matchups: [
          {
            id: 1,
            round: 1,
            team_a: 'Lakers',
            team_b: 'Suns',
            advances_to: 5,
            winner: 'Lakers',
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
            team_a: 'Lakers',
            advances_to: 7,
          },
          {
            id: 6,
            round: 2,
            advances_to: 7,
          },
          {
            id: 7,
            round: 3,
          },
        ],
      });

    expect(response.statusCode).toBe(200);
    bracketCount = await prismaClient.bracket.count();
    expect(bracketCount).toBe(1);

    matchup1 = await prismaClient.matchup.findFirst({
      where: {
        id: 1,
      },
    });
    expect(bracketCount).toBe(1);
    expect(matchup1.winner).toBe('Lakers');
  });

  test(deleteBracketRoute, async () => {
    const [, token] = await createTestUser(true);

    let response = await request(app)
      .post(`${deleteBracketRoute}/1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    const bracket = await createTestBracket('test');

    response = await request(app)
      .post(`${deleteBracketRoute}/${bracket.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const bracketCount = await prismaClient.bracket.count();
    expect(bracketCount).toBe(0);

    response = await request(app)
      .post(`${deleteBracketRoute}/${bracket.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  test(bracketsRoute, async () => {
    const [, token] = await createTestUser();

    let response = await request(app)
      .post(bracketsRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual([]);

    const bracket1 = await createTestBracket('test1');
    const bracket2 = await createTestBracket('test2');

    response = await request(app)
      .post(bracketsRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual([
      {
        id: bracket1.id,
        bracket_name: bracket1.bracket_name,
      },
      {
        id: bracket2.id,
        bracket_name: bracket2.bracket_name,
      },
    ]);
  });
});
