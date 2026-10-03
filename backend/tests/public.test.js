const request = require('supertest');
const app = require('../app');
const { setupDatabase, api } = require('./helpers');

setupDatabase();

describe('public endpoints', () => {
  it('reports health', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('validates and stores contact messages', async () => {
    expect((await api().post('/api/contact-us', { name: 'A', email: 'bad', message: 'Hi' })).status).toBe(400);
    expect((await api().post('/api/contact-us', { name: 'A', email: 'a@example.com' })).status).toBe(400);
    const ok = await api().post('/api/contact-us', { name: 'A', email: 'a@example.com', message: 'Hello!' });
    expect(ok.status).toBe(201);
  });

  it('subscribes to the newsletter once per email', async () => {
    expect((await api().post('/api/newsletter', { email: 'News@Example.com' })).status).toBe(201);
    expect((await api().post('/api/newsletter', { email: 'news@example.com' })).status).toBe(409);
  });

  it('returns JSON errors for unknown routes and malformed JSON', async () => {
    const missing = await api().get('/api/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.message).toMatch(/Route not found/);

    const malformed = await request(app)
      .post('/api/contact-us')
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(malformed.status).toBe(400);
  });

  it('answers 400 (not 500) when the body is missing or not JSON', async () => {
    expect((await request(app).post('/api/auth/login')).status).toBe(400);
    expect((await request(app).post('/api/contact-us').set('Content-Type', 'text/plain').send('hello')).status).toBe(400);
  });
});
