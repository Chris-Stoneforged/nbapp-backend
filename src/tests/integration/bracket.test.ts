import prismaClient from '../../prismaClient';

describe('Bracket routes', () => {
  test.only('Default', () => {
    expect(true).toBeTruthy();
  });

  beforeEach(async () => {
    await prismaClient.user.deleteMany();
  });

  test('Default', async () => {
    expect(true).toBeTruthy();
  });
});
