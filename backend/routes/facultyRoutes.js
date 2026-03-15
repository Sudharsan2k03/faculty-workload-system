const express = require('express');
const { getFaculties, createFaculty, updateFaculty, deleteFaculty, getFacultyDashboardDetails } = require('../controllers/facultyController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getFaculties)
  .post(protect, admin, createFaculty);

router.route('/:id')
  .put(protect, admin, updateFaculty)
  .delete(protect, admin, deleteFaculty);

router.route('/dashboard/me').get(protect, getFacultyDashboardDetails);

module.exports = router;
