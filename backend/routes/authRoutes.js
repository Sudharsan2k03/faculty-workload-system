const express = require('express');
const { authUser, registerUser, forgotPassword, updateUserProfile, updateUserPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);

module.exports = router;
