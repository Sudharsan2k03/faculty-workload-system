const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
// Note: Assuming you might want to add protect/admin middleware later
// const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
