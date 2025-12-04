const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || '30', 10);

const createAccessToken = (user) => jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(48).toString('hex');
  const token_hash = await bcrypt.hash(token, SALT_ROUNDS);
  const expires_at = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user_id: userId, token_hash, expires_at });
  return token;
};

const signup = async (req, res) => {
  try {
    const { name, email, password, recovery_email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      recovery_email,
      password_hash: hashedPassword
    });

    await newUser.save();
    const accessToken = createAccessToken(newUser);
    const refreshToken = await createRefreshToken(newUser._id);
    res.status(201).json({ message: 'User created successfully', userId: newUser._id, token: accessToken, refreshToken });
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

    const token = createAccessToken(user);
    const refreshToken = await createRefreshToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
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
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
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

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
    const tokens = await RefreshToken.find({ expires_at: { $gte: new Date() } }).sort({ created_at: -1 });
    let matched = null;
    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.token_hash)) {
        matched = t;
        break;
      }
    }
    if (!matched) return res.status(401).json({ message: 'Refresh token expired/invalid' });

    const user = await User.findById(matched.user_id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const token = createAccessToken(user);
    const newRefreshToken = await createRefreshToken(user._id);
    res.status(200).json({ message: 'Refreshed', token, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Refresh error', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login , logoutUser, forgetPassword, refresh };
