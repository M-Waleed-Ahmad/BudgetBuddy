const recommendationService = require('../../services/insights/recommendationService');

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, data: null, message: 'User not authenticated' });
    }

    const period = req.query.period || 'this-month';
    const planId = req.query.planId || null;

    const validPeriods = ['this-month', 'last-month', 'last-3-months'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ success: false, code: 'INVALID_PERIOD', message: 'Invalid period.', data: null });
    }

    const data = await recommendationService.getRecommendations({ userId, period, planId });
    return res.status(200).json({ success: true, ...data, message: 'Smart insights generated' });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ success: false, code: 'INSIGHT_ERROR', data: null, message: 'Failed to generate insights.' });
  }
};

module.exports = { getRecommendations };
