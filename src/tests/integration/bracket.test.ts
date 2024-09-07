import prismaClient from '../../prismaClient';

describe('Bracket routes', () => {
  beforeEach(async () => {
    await prismaClient.user.deleteMany();
  });

  test('Default', async () => {
    expect(true).toBeTruthy();
  });
});
