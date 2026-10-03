const mongoose = require('mongoose');
const config = require('./config/env');
const app = require('./app');

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`BudgetBuddy API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
