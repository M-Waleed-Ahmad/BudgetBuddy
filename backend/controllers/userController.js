const User = require('../models/User');
const bcrypt = require('bcrypt');

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;  // We'll get this from JWT middleware
    const { name, email, password, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profileImage) updateData.profileImage = profileImage;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      updateData.passwordHash = passwordHash;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
