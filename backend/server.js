const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');

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

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error(err));
