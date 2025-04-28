// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Use bcryptjs if you installed that

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        // req.user is attached by verifyToken middleware and contains { userId: '...' }
        const user = await User.findById(req.user.userId).select('-password_hash'); // Exclude password hash
        console.log("User Profile:", user); // Debugging line
        if (user) {
            res.json({
                _id: user._id, // Use _id for consistency with MongoDB
                name: user.name,
                email: user.email,
                expenseApproval: user.expenseApproval,
                recovery_email: user.recovery_email,
                profileImage: user.profileImage,
                currency_preference: user.currency_preference,
                created_at: user.created_at,
                language: user.language,
                darkMode: user.darkMode,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};
// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fields allowed to be updated (add/remove as needed)
        const { name, recovery_email, profileImage, currency_preference, password } = req.body;

        // Update standard fields if provided
        user.name = name || user.name;
        user.recovery_email = recovery_email || user.recovery_email;
        user.profileImage = profileImage || user.profileImage; // Update with new Cloudinary URL if sent
        user.currency_preference = currency_preference || user.currency_preference;

        // Update password ONLY if a new password is provided
        if (password) {
            if (password.length < 6) { // Add basic validation
                 return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();

        // Respond with updated user data (excluding password)
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            recovery_email: updatedUser.recovery_email,
            profileImage: updatedUser.profileImage,
            currency_preference: updatedUser.currency_preference,
            // Optionally: Send a new token if role/permissions changed (not typical for profile)
        });

    } catch (error) {
        console.error("Error updating profile:", error);
         // Handle potential duplicate key error for recovery_email if it needs to be unique
        if (error.code === 11000 && error.keyPattern && error.keyPattern.recovery_email) {
            return res.status(400).json({ message: 'Recovery email already in use by another account.' });
        }
        res.status(500).json({ message: "Server error updating profile" });
    }
};

const updateCurrencyPreference = async (req, res) => {
    try {
      console.log("Request body for currency preference update:", req.body); // Debugging line
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { currency_preference, expenseApproval } = req.body; // Destructure the request body
        console.log("User before update:", user); // Debugging line
        console.log("Currency preference to update:", currency_preference); // Debugging line
        console.log("Expense approval to update:", expenseApproval); // Debugging line
        user.currency_preference = req.body.currency_preference || user.currency_preference;
        user.expenseApproval = expenseApproval; // Update expense approval if provided
        await user.save();

        res.json({ message: 'Currency preference updated successfully' });
    } catch (error) {
        console.error("Error updating currency preference:", error);
        res.status(500).json({ message: "Server error updating currency preference" });
    }
};

const updateUI = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { darkMode, language } = req.body; // Destructure the request body
        console.log("User before update:", user); // Debugging line
        console.log("Dark mode to update:", darkMode); // Debugging line
        console.log("Language to update:", language); // Debugging line
        user.darkMode = darkMode; // Update dark mode if provided
        user.language = language; // Update language if provided
        await user.save();
        
        res.json({ message: 'UI preferences updated successfully' });
    }
    catch (error) {
        console.error("Error updating UI preferences:", error);
        res.status(500).json({ message: "Server error updating UI preferences" });
    }
}
module.exports = {
    getUserProfile,
    updateUserProfile,
    updateCurrencyPreference,
    updateUI
};