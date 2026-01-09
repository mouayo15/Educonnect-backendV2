const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');

describe('User API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Register and login test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'usertest',
        email: 'usertest@example.com',
        password: 'Test1234!',
        avatar: '👨'
      });

    authToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['usertest@example.com']);
    await pool.end();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('username');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('xp');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('streak');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/profile', () => {
    it('should update username', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateduser'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('updateduser');
    });

    it('should update avatar', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          avatar: '🚀'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toBe('🚀');
    });

    it('should fail with invalid username', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'ab' // Too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/stats', () => {
    it('should get user stats', async () => {
      const res = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('level');
      expect(res.body.data).toHaveProperty('xp');
    });
  });

  describe('GET /api/v1/users/achievements', () => {
    it('should get user achievements', async () => {
      const res = await request(app)
        .get('/api/v1/users/achievements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('unlocked');
      expect(res.body.data).toHaveProperty('locked');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.unlocked)).toBe(true);
      expect(Array.isArray(res.body.data.locked)).toBe(true);
    });
  });

  describe('GET /api/v1/users/activity', () => {
    it('should get user activity history', async () => {
      const res = await request(app)
        .get('/api/v1/users/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activities');
      expect(Array.isArray(res.body.data.activities)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/users/activity?limit=5&page=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should get public user profile', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('username');
      expect(res.body.data).not.toHaveProperty('email'); // Should not expose email
    });
  });
});
