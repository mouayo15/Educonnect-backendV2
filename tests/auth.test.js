const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');

describe('Auth API', () => {
  let authToken;
  let refreshToken;
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test1234!',
    avatar: '👤'
  };

  afterAll(async () => {
    // Cleanup: delete test user
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    await pool.end();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.username).toBe(testUser.username);
      
      authToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com',
          password: 'weak'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
