import app from '../app';
import {
  createTestUser,
  createTournamentForUser,
  getInviteCode,
} from './testUtils';
import request from 'supertest';
import prismaClient from '../prismaClient';
import { join } from 'path';

describe('Tournament Routes', () => {
  const createRoute = '/api/tournament/create';
  const leaveRoute = '/api/tournament/leave';
  const getCodeRoute = '/api/tournament/generate-invite-code';
  const joinRoute = '/api/tournament/join';
  const membersRoute = '/api/tournament/members';

  const nickname = 'test';
  const email = 'test@gmail.com';
  const password = 'test';

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
    await prismaClient.tournament.deleteMany();
  });

  test(createRoute, async () => {
    const [, token] = await createTestUser(nickname, email, password);

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
    const [user, token] = await createTestUser(nickname, email, password);
    let response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await createTournamentForUser(user);

    response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`);

    const updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
    });

    expect(response.statusCode).toBe(200);
    expect(updatedUser.tournament_id).toBe(null);
  });

  test(getCodeRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    let response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await createTournamentForUser(user);

    response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).not.toBe('');
  });

  test(joinRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    const [sender] = await createTestUser(
      'sender',
      'sender@gmail.com',
      'sender'
    );

    // Invalid invite code
    let response = await request(app)
      .post(`${joinRoute}/invalid_code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    const tournament = await createTournamentForUser(sender);
    let inviteCode = await getInviteCode(sender, tournament, 0);

    // Expired invite code
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    // Valid invite code
    inviteCode = await getInviteCode(sender, tournament, 100);
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
    });

    expect(updatedUser.tournament_id).toBe(tournament.id);

    // Already in team
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  test(membersRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    let response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    const tournament = await createTournamentForUser(user);

    response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: user.id,
        nickname: user.nickname,
      },
    ]);

    const [member1] = await createTestUser(
      'member1',
      'member1@gmail.com',
      'member1',
      'User',
      tournament.id
    );
    const [member2] = await createTestUser(
      'member2',
      'member2@gmail.com',
      'member2',
      'User',
      tournament.id
    );

    response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: user.id,
        nickname: user.nickname,
      },
      {
        id: member1.id,
        nickname: member1.nickname,
      },
      {
        id: member2.id,
        nickname: member2.nickname,
      },
    ]);
  });
});
