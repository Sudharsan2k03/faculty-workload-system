const express = require('express');
const { getWorkloads, assignWorkload, removeWorkload, updateWorkload } = require('../controllers/workloadController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, admin, getWorkloads)
  .post(protect, admin, assignWorkload);

router.route('/:id')
  .put(protect, admin, updateWorkload)
  .delete(protect, admin, removeWorkload);

module.exports = router;
