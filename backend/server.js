const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); // <-- Import category routes
const userRoutes = require('./routes/userRoutes');
const inviteRoutes = require('./routes/inviteRoutes'); // <-- Import invite routes
const MonthlyBudgetRoutes = require('./routes/MonthlyBudgetRoutes'); // <-- Import budget routes
const BudgetRoutes = require('./routes/BudgetRoutes'); // <-- Import budget routes
const ExpenseRoutes = require('./routes/expenseRoutes'); // <-- Import expense routes
const reportRoutes = require('./routes/reportRoutes');
const billingRoutes = require('./routes/billingRoutes');
const familyPlanRoutes = require('./routes/FamilyPlanRoutes'); // Adjust path
const familyMemberRoutes = require('./routes/FamilyMemberRoutes'); // Adjust path
const FamilyExpenseRoutes = require('./routes/FamilyPlanExpenseRoutes'); // Adjust path
const NotificationRoutes = require('./routes/NotificationsRoutes'); // Adjust path
const GenericRoutes = require('./routes/GenericRoutes'); // Adjust path
const insightRoutes = require('./routes/insightRoutes');
const blogRoutes = require('./routes/blogRoutes');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({
  origin: 'http://localhost:5173',  // or '*' for all origins
  credentials: true                 // allow credentials if you’ll use cookies/session later
}));

// Middleware
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes); // <-- Use category routes
app.use('/api/monthly-budgets', MonthlyBudgetRoutes); // <-- Use budget routes
app.use('/api/budgets', BudgetRoutes); // <-- Use budget routes

app.use('/api/invites', inviteRoutes); // <-- Use invite routes
app.use('/api/expenses', ExpenseRoutes); // <-- Use expense routes
app.use('/api/reports', reportRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/family-plans', familyPlanRoutes); // <-- Use family plan routes
app.use('/api/family-members', familyMemberRoutes); // <-- Use family member routes
app.use('/api/family-expenses', FamilyExpenseRoutes); // <-- Use family expense routes
app.use('/api/notifications', NotificationRoutes); // <-- Use notification routes
app.use('/api/insights', insightRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/', GenericRoutes); // <-- Use generic routes

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error(err));
