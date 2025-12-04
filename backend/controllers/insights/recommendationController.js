const recommendationService = require('../../services/insights/recommendationService');

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, data: null, message: 'User not authenticated' });
    }

    const period = req.query.period || 'this-month';
    if (period !== 'this-month') {
      return res.status(400).json({ success: false, data: null, message: 'Unsupported period. Use period=this-month.' });
    }

    const data = await recommendationService.getRecommendationsForThisMonth(userId);
    return res.status(200).json({ success: true, data, message: 'Smart insights generated' });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ success: false, data: null, message: 'Server error while generating insights' });
  }
};

module.exports = { getRecommendations };
