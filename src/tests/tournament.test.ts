import app from '../app';
import { createTestUser, createTournamentForUser } from './testUtils';
import request from 'supertest';
import prismaClient from '../prismaClient';

describe('Tournament Routes', () => {
  const createRoute = '/api/tournament/create';
  const leaveRoute = '/api/tournament/leave';
  const getCodeRoute = '/api/tournament/generate-invite-code';
  const joinRoute = '/api/tournament/join/';

  const nickname = 'test';
  const email = 'test@gmail.com';
  const password = 'test';

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
    await prismaClient.tournament.deleteMany();
  });

  test(createRoute, async () => {
    const token = await createTestUser(nickname, email, password);

    // Create tournament
    let response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    const user = await prismaClient.user.findFirst({ where: { email: email } });
    const tournament = await prismaClient.tournament.findFirst({});
    expect(user.tournament_id).toEqual(tournament.id);

    response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
  });

  test(leaveRoute, async () => {
    const token = await createTestUser(nickname, email, password);
    let response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await createTournamentForUser(email);

    response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const user = await prismaClient.user.findFirst({ where: { email: email } });
    expect(user.tournament_id).toBe(null);
  });

  test(getCodeRoute, async () => {
    const token = await createTestUser(nickname, email, password);
    let response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await createTournamentForUser(email);

    response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).not.toBe('');
  });
});
