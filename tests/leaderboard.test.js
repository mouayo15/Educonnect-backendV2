const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');

describe('Leaderboard API', () => {
  let authToken;

  beforeAll(async () => {
    // Register test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'leaderuser',
        email: 'leader@example.com',
        password: 'Test1234!',
        avatar: '🏆'
      });

    authToken = registerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['leader@example.com']);
    await pool.end();
  });

  describe('GET /api/v1/leaderboard/global', () => {
    it('should get global leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/global');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leaderboard');
      expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/global?limit=10&offset=0');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.leaderboard.length).toBeLessThanOrEqual(10);
    });

    it('should include user rank when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/global')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('userRank');
    });
  });

  describe('GET /api/v1/leaderboard/weekly', () => {
    it('should get weekly leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/weekly');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leaderboard');
      expect(res.body.data).toHaveProperty('period');
      expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
    });
  });

  describe('GET /api/v1/leaderboard/streak', () => {
    it('should get streak leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/leaderboard/streak');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leaderboard');
      expect(res.body.data).toHaveProperty('type');
      expect(res.body.data.type).toBe('Streak');
    });
  });

  describe('GET /api/v1/leaderboard/subject/:subjectId', () => {
    it('should get subject leaderboard', async () => {
      // Get a subject ID first
      const subjectRes = await pool.query('SELECT id FROM subjects LIMIT 1');
      
      if (subjectRes.rows.length === 0) {
        console.log('Skipping: No subjects in database');
        return;
      }

      const subjectId = subjectRes.rows[0].id;

      const res = await request(app)
        .get(`/api/v1/leaderboard/subject/${subjectId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('leaderboard');
      expect(res.body.data).toHaveProperty('subject');
    });

    it('should return 404 for non-existent subject', async () => {
      const fakeId = 99999; // Use a non-existent integer ID
      const res = await request(app)
        .get(`/api/v1/leaderboard/subject/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
