const { setupDatabase, api, createUser } = require('./helpers');

setupDatabase();

describe('signup', () => {
  it('creates an account, normalises the email and returns a session', async () => {
    const res = await api().post('/api/auth/signup', {
      name: 'Ayesha',
      email: '  Ayesha@Example.com ',
      password: 'Password123',
      currency_preference: 'PKR',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Ayesha', email: 'ayesha@example.com', currency_preference: 'PKR' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate emails regardless of case', async () => {
    await createUser({ email: 'dup@example.com' });
    const res = await api().post('/api/auth/signup', { name: 'Dup', email: 'DUP@example.com', password: 'Password123' });
    expect(res.status).toBe(409);
  });

  it('validates input', async () => {
    const weak = await api().post('/api/auth/signup', { name: 'A', email: 'a@example.com', password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.message).toMatch(/at least 8/);

    const badEmail = await api().post('/api/auth/signup', { name: 'A', email: 'not-an-email', password: 'Password123' });
    expect(badEmail.status).toBe(400);

    const badCurrency = await api().post('/api/auth/signup', {
      name: 'A',
      email: 'b@example.com',
      password: 'Password123',
      currency_preference: 'XYZ',
    });
    expect(badCurrency.status).toBe(400);
  });
});

describe('login', () => {
  it('logs in with the right password (email is case-insensitive)', async () => {
    await createUser({ email: 'login@example.com' });
    const res = await api().post('/api/auth/login', { email: 'LOGIN@example.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await createUser({ email: 'known@example.com' });
    const wrong = await api().post('/api/auth/login', { email: 'known@example.com', password: 'WrongPass123' });
    const unknown = await api().post('/api/auth/login', { email: 'nobody@example.com', password: 'Password123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});

describe('authentication middleware', () => {
  it('returns 401 without a token or with an invalid token', async () => {
    expect((await api().get('/api/user/profile')).status).toBe(401);
    expect((await api('not-a-jwt').get('/api/user/profile')).status).toBe(401);
  });

  it('returns the profile for a valid token', async () => {
    const { client } = await createUser({ name: 'Profile Person' });
    const res = await client.get('/api/user/profile');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Profile Person');
  });
});

describe('password reset', () => {
  it('always answers 200 so emails cannot be enumerated', async () => {
    const res = await api().post('/api/auth/forgot-password', { email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.devResetUrl).toBeUndefined();
  });

  it('resets the password with a valid token and invalidates old sessions', async () => {
    const { client, user } = await createUser({ email: 'reset@example.com' });

    const forgot = await api().post('/api/auth/forgot-password', { email: user.email });
    expect(forgot.status).toBe(200);
    const token = new URL(forgot.body.devResetUrl).searchParams.get('token');

    const reset = await api().post('/api/auth/reset-password', { token, password: 'BrandNew456' });
    expect(reset.status).toBe(200);

    // The token is single-use.
    const reuse = await api().post('/api/auth/reset-password', { token, password: 'Another789' });
    expect(reuse.status).toBe(400);

    expect((await client.get('/api/user/profile')).status).toBe(401);
    const oldLogin = await api().post('/api/auth/login', { email: user.email, password: 'Password123' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await api().post('/api/auth/login', { email: user.email, password: 'BrandNew456' });
    expect(newLogin.status).toBe(200);
  });
});

describe('profile updates', () => {
  it('requires the current password to change it and returns a fresh token', async () => {
    const { client } = await createUser();

    const wrong = await client.put('/api/user/profile', { currentPassword: 'nope', newPassword: 'NewPassword1' });
    expect(wrong.status).toBe(400);

    const ok = await client.put('/api/user/profile', { currentPassword: 'Password123', newPassword: 'NewPassword1' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));

    expect((await client.get('/api/user/profile')).status).toBe(401);
    expect((await api(ok.body.token).get('/api/user/profile')).status).toBe(200);
  });

  it('updates name and currency', async () => {
    const { client } = await createUser();
    const res = await client.put('/api/user/profile', { name: 'Renamed', currency_preference: 'EUR' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Renamed', currency_preference: 'EUR' });
    expect(res.body.token).toBeUndefined();
  });
});
