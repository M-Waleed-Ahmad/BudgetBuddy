const Entitlement = require('../models/Entitlement');

// Middleware to require an entitlement feature
const requireEntitlement = (feature) => async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Auth required', data: null });

    const ent = await Entitlement.findOne({ user_id: userId, feature, active: true });
    if (!ent) return res.status(403).json({ success: false, message: 'Upgrade required for this feature', data: null });

    next();
  } catch (err) {
    console.error('Entitlement check failed', err);
    return res.status(500).json({ success: false, message: 'Server error checking entitlement', data: null });
  }
};

module.exports = { requireEntitlement };
