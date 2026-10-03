const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / non-browser requests (no Origin header) and configured clients.
      if (!origin || config.clientUrls.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: '100kb' }));
// Express 5 leaves req.body undefined when there is no JSON body; handlers expect an object.
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/monthly-budgets', require('./routes/monthlyBudgetRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/family-plans', require('./routes/familyPlanRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/publicRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
