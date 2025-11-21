const express = require('express');
const router = express.Router();
const {
  getClassAnalytics,
  getStudentAnalytics,
  getOverallAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/class/:classId', getClassAnalytics);
router.get('/student/:studentId', getStudentAnalytics);
router.get('/overall', authorize('faculty', 'admin'), getOverallAnalytics);

module.exports = router;

