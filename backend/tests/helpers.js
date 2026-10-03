const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongo;

/**
 * Connects each test file to an isolated database and wipes it between tests.
 * Uses an in-memory MongoDB by default; set MONGO_TEST_URI to use an existing server instead
 * (each test file gets its own throwaway database, dropped afterwards).
 */
function setupDatabase() {
  beforeAll(async () => {
    if (process.env.MONGO_TEST_URI) {
      const dbName = `budgetbuddy_test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
      await mongoose.connect(process.env.MONGO_TEST_URI, { dbName });
    } else {
      mongo = await MongoMemoryServer.create();
      await mongoose.connect(mongo.getUri());
    }
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  });

  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    if (process.env.MONGO_TEST_URI) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongo?.stop();
  });
}

/** Supertest client that sends the given bearer token. */
function api(token) {
  const withAuth = (req) => (token ? req.set('Authorization', `Bearer ${token}`) : req);
  return {
    get: (url) => withAuth(request(app).get(url)),
    post: (url, body) => withAuth(request(app).post(url)).send(body),
    put: (url, body) => withAuth(request(app).put(url)).send(body),
    delete: (url) => withAuth(request(app).delete(url)),
  };
}

let userCounter = 0;

/** Signs up a fresh user and returns { token, user, client }. */
async function createUser(overrides = {}) {
  userCounter += 1;
  const body = {
    name: `User ${userCounter}`,
    email: `user${userCounter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await api().post('/api/auth/signup', body);
  if (res.status !== 201) throw new Error(`Signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, user: res.body.user, client: api(res.body.token), password: body.password };
}

/** Today's UTC calendar date as YYYY-MM-DD (matches how the API stores dates). */
const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => today().slice(0, 7);

module.exports = { setupDatabase, api, createUser, today, currentMonth };
