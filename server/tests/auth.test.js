import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Health & config', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/config exposes public keys (blank when unset)', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(typeof res.body.googleClientId).toBe('string');
    expect(typeof res.body.razorpayKey).toBe('string');
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('Auth', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Buyer', email: 'testbuyer@estatehub.test', password: 'password123', role: 'buyer' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('testbuyer@estatehub.test');
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'testbuyer@estatehub.test', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@estatehub.test', password: '123' });
    expect(res.status).toBe(400);
  });

  it('logs in and gets a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testbuyer@estatehub.test', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testbuyer@estatehub.test', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me works with a token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testbuyer@estatehub.test', password: 'password123' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testbuyer@estatehub.test');
  });

  it('google login rejects an invalid token (configured or not)', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'fake-token' });
    expect([400, 401, 500, 503]).toContain(res.status);
  });
});
