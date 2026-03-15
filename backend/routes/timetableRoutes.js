const express = require('express');
const { 
  getTimetable, 
  generateTimetable, 
  getReports,
  updateTimetableSlot,
  deleteTimetableSlot
} = require('../controllers/timetableController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getTimetable);
router.route('/generate').post(protect, admin, generateTimetable);
router.route('/reports').get(protect, admin, getReports);

router.route('/:id')
  .put(protect, admin, updateTimetableSlot)
  .delete(protect, admin, deleteTimetableSlot);

module.exports = router;
