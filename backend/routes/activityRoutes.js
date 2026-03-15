const express = require('express');
const { getRecentActivities } = require('../controllers/activityController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/recent', protect, admin, getRecentActivities);

module.exports = router;
