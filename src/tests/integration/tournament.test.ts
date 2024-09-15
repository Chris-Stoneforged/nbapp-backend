import app from '../../app';
import {
  createTestBracket,
  createTestUser,
  createTestTournament,
  getTestInviteCode,
  userJoinTournament,
  resetDatabase,
} from '../testUtils';
import request from 'supertest';
import prismaClient from '../../prismaClient';

describe('Tournament Routes', () => {
  const createRoute = '/api/v1/tournament/create';
  const leaveRoute = '/api/v1/tournament/leave';
  const getCodeRoute = '/api/v1/tournament/generate-invite-code';
  const joinRoute = '/api/v1/tournament/join';
  const tournamentDetailsRoute = '/api/v1/tournament';
  const inviteRotue = '/api/v1/tournament/invite';

  beforeEach(async () => {
    await resetDatabase();
  });

  test.only('Default', () => {
    expect(true).toBeTruthy();
  });

  test(createRoute, async () => {
    const [user, token] = await createTestUser();

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
    const [user, token] = await createTestUser();
    const [tournament] = await createTestTournament();

    let response = await request(app)
      .post(`${leaveRoute}/blah`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post(`${leaveRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .post(`${leaveRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    const updatedUser = await prismaClient.user.findFirst({
      where: { id: user.id },
      include: { tournaments: true },
    });

    expect(updatedUser.tournaments).toHaveLength(0);
  });

  test(getCodeRoute, async () => {
    const [user, token] = await createTestUser();
    const [tournament] = await createTestTournament();

    let response = await request(app)
      .post(`${getCodeRoute}/blah`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .post(`${getCodeRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .post(`${getCodeRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).not.toBe('');

    response = await request(app)
      .post(`${getCodeRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Check that we are updating a code instead of adding a new one
    const codeCount = await prismaClient.inviteToken.count();
    expect(codeCount).toBe(1);
  });

  test(joinRoute, async () => {
    const [user, token] = await createTestUser();

    // Invalid invite code
    let response = await request(app)
      .post(`${joinRoute}/invalid_code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    const [sender] = await createTestUser('sender@gmail.com');
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
      memberData: [
        { id: sender.id, nickname: sender.nickname, score: 0 },
        { id: user.id, nickname: user.nickname, score: 0 },
      ],
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

  test(tournamentDetailsRoute, async () => {
    const [user, token] = await createTestUser();
    const [tournament, bracket] = await createTestTournament();

    let response = await request(app)
      .get(`${tournamentDetailsRoute}/sdfsdf`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    response = await request(app)
      .get(`${tournamentDetailsRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    await userJoinTournament(user, tournament);

    response = await request(app)
      .get(`${tournamentDetailsRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual({
      tournamentId: tournament.id,
      bracketName: bracket.bracket_name,
      memberData: [{ id: user.id, nickname: user.nickname, score: 0 }],
    });

    const [member1] = await createTestUser('test1@gmail.com');
    const [member2] = await createTestUser('test2@gmail.com');

    await userJoinTournament(member1, tournament);
    await userJoinTournament(member2, tournament);

    response = await request(app)
      .get(`${tournamentDetailsRoute}/${tournament.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tournamentId: tournament.id });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual({
      tournamentId: tournament.id,
      bracketName: bracket.bracket_name,
      memberData: [
        {
          id: user.id,
          nickname: user.nickname,
          score: 0,
        },
        {
          id: member1.id,
          nickname: member1.nickname,
          score: 0,
        },
        {
          id: member2.id,
          nickname: member2.nickname,
          score: 0,
        },
      ],
    });
  });

  test(inviteRotue, async () => {
    const [user, token] = await createTestUser();

    // Invalid invite code
    let response = await request(app)
      .get(`${inviteRotue}/invalid_code`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    const [sender] = await createTestUser('sender@gmail.com');
    const [tournament, bracket] = await createTestTournament();
    await userJoinTournament(sender, tournament);
    let inviteCode = await getTestInviteCode(sender, tournament, 0);

    // Expired invite code
    response = await request(app)
      .get(`${inviteRotue}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    // Valid invite code
    inviteCode = await getTestInviteCode(sender, tournament, 5000);
    response = await request(app)
      .get(`${inviteRotue}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual({
      code: inviteCode,
      sender: sender.id,
      bracketName: bracket.bracket_name,
    });

    await userJoinTournament(user, tournament);

    // Already in team
    response = await request(app)
      .get(`${inviteRotue}/${inviteCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});
