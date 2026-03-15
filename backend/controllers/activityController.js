const ActivityLog = require('../models/ActivityLog');

// GET /api/activity/recent  → Returns latest 10 activity logs
const getRecentActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRecentActivities };
