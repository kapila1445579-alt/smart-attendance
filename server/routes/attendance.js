const express = require('express');
const router = express.Router();
const {
  createSession,
  markAttendanceFace,
  markAttendanceQR,
  markAttendanceNFC,
  getSession,
  endSession,
  getReports
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/create-session', authorize('faculty', 'admin'), createSession);
router.post('/mark-face', markAttendanceFace);
router.post('/mark-qr', markAttendanceQR);
router.post('/mark-nfc', markAttendanceNFC);
router.get('/session/:id', getSession);
router.put('/session/:id/end', authorize('faculty', 'admin'), endSession);
router.get('/reports', getReports);

module.exports = router;

