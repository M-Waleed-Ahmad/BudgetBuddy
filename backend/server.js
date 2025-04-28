const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); // <-- Import category routes
const userRoutes = require('./routes/userRoutes');
const inviteRoutes = require('./routes/inviteRoutes'); // <-- Import invite routes
const MonthlyBudgetRoutes = require('./routes/MonthlyBudgetRoutes'); // <-- Import budget routes
const BudgetRoutes = require('./routes/BudgetRoutes'); // <-- Import budget routes
const cors = require('cors');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({
  origin: 'http://localhost:5173',  // or '*' for all origins
  credentials: true                 // allow credentials if you’ll use cookies/session later
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes); // <-- Use category routes
app.use('/api/monthly-budgets', MonthlyBudgetRoutes); // <-- Use budget routes
app.use('/api/budgets', BudgetRoutes); // <-- Use budget routes

app.use('/api/invites', inviteRoutes); // <-- Use invite routes


// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error(err));
