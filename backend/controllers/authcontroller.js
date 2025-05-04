const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  try {
    const { name, email, password, recovery_email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      recovery_email,
      password_hash: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const logoutUser = async (req, res) => {
  try {
    console.log('Logout request received.');

    console.log(`User ${req.user?.userId || 'Unknown'} logged out.`);

    res.status(200).json({ message: 'Logout successful. Please clear your token from storage.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email,recovery_email,password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.recovery_email !== recovery_email) return res.status(400).json({ message: 'Recovery email does not match' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    user.password_hash = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}


module.exports = { signup, login , logoutUser, forgetPassword };
