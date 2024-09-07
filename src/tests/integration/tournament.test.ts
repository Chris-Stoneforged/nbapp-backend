import app from '../../app';
import {
  createTestBracket,
  createTestUser,
  createTestTournament,
  getTestInviteCode,
  userJoinTournament,
} from '../testUtils';
import request from 'supertest';
import prismaClient from '../../prismaClient';

describe('Tournament Routes', () => {
  const createRoute = '/api/tournament/create';
  const leaveRoute = '/api/tournament/leave';
  const getCodeRoute = '/api/tournament/generate-invite-code';
  const joinRoute = '/api/tournament/join';
  const membersRoute = '/api/tournament/members';
  const tournamentsRoute = '/api/tournament/tournaments';

  const nickname = 'test';
  const email = 'test@gmail.com';
  const password = 'test';

  beforeEach(async () => {
    await prismaClient.tournament.deleteMany();
    await prismaClient.bracket.deleteMany();
    await prismaClient.inviteToken.deleteMany();
    await prismaClient.user.deleteMany();
  });

  test.only('Default', () => {
    expect(true).toBeTruthy();
  });

  test(createRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);

    // Invalid bracket id
    let response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ bracketId: -1 });

    expect(response.statusCode).toBe(400);
    const bracket = await createTestBracket('testBracket');

    // Valid request
    response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ bracketId: bracket.id });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('tournamentId');
    expect(response.body.data).toHaveProperty('bracketName');
    expect(response.body.data.bracketName).toBe(bracket.bracket_name);

    const tournamentId = response.body.data.tournamentId;
    let updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
      include: { tournaments: true },
    });
    const tournament = await prismaClient.tournament.findFirst({
      where: { id: tournamentId },
    });

    expect(updatedUser.tournaments).toContainEqual(tournament);

    // Repeat create request
    response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ bracketId: bracket.id });

    expect(response.statusCode).toBe(400);

    // Can create multiple
    const bracket2 = await createTestBracket('test2');
    response = await request(app)
      .post(createRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ bracketId: bracket2.id });

    expect(response.statusCode).toBe(200);

    const tournament2Id = response.body.data.tournamentId;
    updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
      include: { tournaments: true },
    });
    const tournament2 = await prismaClient.tournament.findFirst({
      where: { id: tournament2Id },
    });

    expect(updatedUser.tournaments).toContainEqual(tournament);
    expect(updatedUser.tournaments).toContainEqual(tournament2);
  });

  test(leaveRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    const [tournament] = await createTestTournament();

    let response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .post(leaveRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(200);
    const updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
      include: { tournaments: true },
    });

    expect(updatedUser.tournaments).toHaveLength(0);
  });

  test(getCodeRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    const [tournament] = await createTestTournament();

    let response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).not.toBe('');

    response = await request(app)
      .post(getCodeRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    // Check that we are updating a code instead of adding a new one
    const codeCount = await prismaClient.inviteToken.count();
    expect(codeCount).toBe(1);
  });

  test(joinRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);

    // Invalid invite code
    let response = await request(app)
      .post(`${joinRoute}/invalid_code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    const [sender] = await createTestUser(
      'sender',
      'sender@gmail.com',
      'sender'
    );
    const [tournament, bracket] = await createTestTournament();
    await userJoinTournament(sender, tournament);
    let inviteCode = await getTestInviteCode(sender, tournament, 0);

    // Expired invite code
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    // Valid invite code
    inviteCode = await getTestInviteCode(sender, tournament, 5000);
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
      include: { tournaments: true },
    });

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual({
      tournamentId: tournament.id,
      bracketName: bracket.bracket_name,
    });

    expect(updatedUser.tournaments).toContainEqual({
      id: tournament.id,
      bracket_id: bracket.id,
    });

    // Already in team
    response = await request(app)
      .post(`${joinRoute}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  test(membersRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);
    const [tournament] = await createTestTournament();

    let response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

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
      'member1'
    );
    const [member2] = await createTestUser(
      'member2',
      'member2@gmail.com',
      'member2'
    );

    await userJoinTournament(member1, tournament);
    await userJoinTournament(member2, tournament);

    response = await request(app)
      .get(membersRoute)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

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

  test(tournamentsRoute, async () => {
    const [user, token] = await createTestUser(nickname, email, password);

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
