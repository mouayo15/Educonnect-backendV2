const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');

describe('Quiz API', () => {
  let authToken;
  let userId;
  let quizId;

  beforeAll(async () => {
    // Create test user and login
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'quizuser',
        email: 'quiz@example.com',
        password: 'Test1234!',
        avatar: '👤'
      });

    authToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;

    // Get a quiz ID from database
    const quizRes = await pool.query('SELECT id FROM quizzes LIMIT 1');
    if (quizRes.rows.length > 0) {
      quizId = quizRes.rows[0].id;
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', ['quiz@example.com']);
    await pool.end();
  });

  describe('GET /api/v1/quizzes', () => {
    it('should get all quizzes', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter quizzes by difficulty', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes?difficulty=easy');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach(quiz => {
        expect(quiz.difficulty).toBe('easy');
      });
    });
  });

  describe('GET /api/v1/quizzes/:quizId', () => {
    it('should get quiz by ID', async () => {
      if (!quizId) {
        console.log('Skipping: No quizzes in database');
        return;
      }

      const res = await request(app)
        .get(`/api/v1/quizzes/${quizId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('title');
    });

    it('should return 404 for non-existent quiz', async () => {
      const fakeId = 99999; // Non-existent integer ID
      const res = await request(app)
        .get(`/api/v1/quizzes/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/quizzes/:quizId/questions', () => {
    it('should get quiz questions without correct answers', async () => {
      if (!quizId) return;

      const res = await request(app)
        .get(`/api/v1/quizzes/${quizId}/questions`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).not.toHaveProperty('correct_option');
        expect(res.body.data[0]).toHaveProperty('question_text');
        expect(res.body.data[0]).toHaveProperty('option_a');
      }
    });
  });

  describe('POST /api/v1/quizzes/:quizId/submit', () => {
    it('should submit quiz and award XP on first attempt', async () => {
      if (!quizId) return;

      // Get questions first
      const questionsRes = await request(app)
        .get(`/api/v1/quizzes/${quizId}/questions`);

      const answers = questionsRes.body.data.map(() => 0); // Answer 0 for all

      const res = await request(app)
        .post(`/api/v1/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers,
          timeSpent: 300
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('xpEarned');
      expect(res.body.data).toHaveProperty('isFirstAttempt');
      expect(res.body.data.isFirstAttempt).toBe(true);
      expect(res.body.data.xpEarned).toBeGreaterThanOrEqual(0);
    });

    it('should not award XP on second attempt (quiz blanc)', async () => {
      if (!quizId) return;

      const questionsRes = await request(app)
        .get(`/api/v1/quizzes/${quizId}/questions`);

      const answers = questionsRes.body.data.map(() => 0);

      const res = await request(app)
        .post(`/api/v1/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers,
          timeSpent: 250
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFirstAttempt).toBe(false);
      expect(res.body.data.xpEarned).toBe(0);
    });

    it('should fail without authentication', async () => {
      if (!quizId) return;

      const res = await request(app)
        .post(`/api/v1/quizzes/${quizId}/submit`)
        .send({
          answers: [0, 0, 0],
          timeSpent: 300
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate answers array', async () => {
      if (!quizId) return;

      const res = await request(app)
        .post(`/api/v1/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [], // Empty array
          timeSpent: 300
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/quizzes/attempts/history', () => {
    it('should get user quiz history', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes/attempts/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes/attempts/history');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
