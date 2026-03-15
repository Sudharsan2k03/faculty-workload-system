const express = require('express');
const { getClassrooms, createClassroom, updateClassroom, deleteClassroom } = require('../controllers/classroomController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getClassrooms)
  .post(protect, admin, createClassroom);

router.route('/:id')
  .put(protect, admin, updateClassroom)
  .delete(protect, admin, deleteClassroom);

module.exports = router;
