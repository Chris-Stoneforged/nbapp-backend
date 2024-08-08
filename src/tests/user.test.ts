import request from 'supertest';
import app from '../app';

describe('User Routes', () => {
  test('register', async () => {
    const response = await request(app)
      .post('/api/register')
      .send({ nickname: 'test1', email: 'test1@gmail.com', password: 'test1' })
      .expect(200);
  });
});
