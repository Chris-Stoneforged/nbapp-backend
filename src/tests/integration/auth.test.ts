import request from 'supertest';
import app from '../../app';
import prismaClient from '../../prismaClient';
import {
  createTestBracket,
  createTestTournament,
  createTestUser,
  userJoinTournament,
} from '../testUtils';

describe('Auth routes', () => {
  const registerRoute = '/api/v1/user/register';
  const loginRoute = '/api/v1/user/login';
  const logoutRoute = '/api/v1/user/logout';
  const tournamentsRoute = '/api/v1/user/tournaments';

  const validTokenRegex = new RegExp(
    '^token=([A-Za-z0-9_-]+.[A-Za-z0-9_-]+.[A-Za-z0-9_-]+);'
  );
  const invalidTokenRegex = new RegExp('^token=none;');

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
  });

  test(registerRoute, async () => {
    const email = 'test@gmail.com';
    const password = 'test';
    const nickname = 'test';

    // Not enough info
    let response = await request(app)
      .post(registerRoute)
      .send({ nickname: nickname, email: email });

    expect(response.status).toBe(400);

    // Valid registration
    response = await request(app)
      .post(registerRoute)
      .send({ nickname: nickname, email: email, password: password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');

    const cookie = response.headers['set-cookie'];
    expect(cookie).toHaveLength(1);
    expect(cookie[0]).toMatch(validTokenRegex);

    // User already exists
    response = await request(app)
      .post(registerRoute)
      .send({ nickname: nickname, email: email, password: password });

    expect(response.status).toBe(400);

    // Password not stored
    const user = await prismaClient.user.findFirst({
      where: { email: email },
    });

    expect(user.password).not.toBe(password);
  });

  test(loginRoute, async () => {
    // Invalid user
    let response = await request(app)
      .post(loginRoute)
      .send({ email: 'invalid@gmail.com', password: 'invalid' });

    expect(response.status).toBe(401);

    // Create user
    const [user] = await createTestUser(false, 'test123');

    // Wrong password
    response = await request(app)
      .post(loginRoute)
      .send({ email: user.email, password: 'invalid' });

    expect(response.status).toBe(401);

    // Correct login
    response = await request(app)
      .post(loginRoute)
      .send({ email: user.email, password: 'test123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');

    const cookie = response.headers['set-cookie'];
    expect(cookie).toHaveLength(1);
    expect(cookie[0]).toMatch(validTokenRegex);
  });

  test(logoutRoute, async () => {
    // Logout without token
    let response = await request(app).post(logoutRoute);
    expect(response.status).toBe(401);

    const [, token] = await createTestUser();

    // Valid logout
    response = await request(app)
      .post(logoutRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const cookie = response.headers['set-cookie'];
    expect(cookie).toHaveLength(1);
    expect(cookie[0]).toMatch(invalidTokenRegex);
  });

  test(tournamentsRoute, async () => {
    const [user, token] = await createTestUser();

    let response = await request(app)
      .get(tournamentsRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual([]);

    const bracket1 = await createTestBracket('test1');
    const bracket2 = await createTestBracket('test2');
    const [tournament1] = await createTestTournament(bracket1);
    const [tournament2] = await createTestTournament(bracket2);

    await userJoinTournament(user, tournament1);

    response = await request(app)
      .get(tournamentsRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual([
      {
        tournamentId: tournament1.id,
        bracketName: bracket1.bracket_name,
      },
    ]);

    await userJoinTournament(user, tournament2);

    response = await request(app)
      .get(tournamentsRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual([
      {
        tournamentId: tournament1.id,
        bracketName: bracket1.bracket_name,
      },
      {
        tournamentId: tournament2.id,
        bracketName: bracket2.bracket_name,
      },
    ]);
  });
});
