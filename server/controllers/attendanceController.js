const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Class = require('../models/Class');
const User = require('../models/User');
const { generateQRCode, verifyQRCode } = require('../services/qrService');
const { verifyFace } = require('../services/faceRecognition');

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// @desc    Create attendance session
// @route   POST /api/attendance/create-session
// @access  Private (Faculty)
exports.createSession = async (req, res) => {
  try {
    const { classId, sessionType, verificationMethod, duration, location } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if faculty owns the class
    if (classData.faculty.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create session for this class'
      });
    }

    const session = await AttendanceSession.create({
      classId,
      facultyId: req.user.id,
      sessionType,
      verificationMethod,
      duration: duration || 60,
      location
    });

    let qrData = null;
    if (verificationMethod === 'qr' || verificationMethod === 'hybrid') {
      qrData = await generateQRCode(session._id.toString(), duration || 15);
      session.qrCode = {
        code: qrData.code,
        expiresAt: qrData.expiresAt
      };
      await session.save();
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`session-${session._id}`).emit('session-created', session);

    res.status(201).json({
      success: true,
      data: {
        session,
        qrCode: qrData ? qrData.qrDataURL : null
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark attendance via facial recognition
// @route   POST /api/attendance/mark-face
// @access  Private
exports.markAttendanceFace = async (req, res) => {
  try {
    const { sessionId, image, location } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Check if user is enrolled in the class
    const classData = await Class.findById(session.classId);
    if (!classData.students.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Check if already marked
    const alreadyMarked = session.attendance.find(
      a => a.studentId.toString() === req.user.id
    );
    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Verify face
    if (!req.user.faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: 'Face not registered. Please register your face first.'
      });
    }

    const imageBuffer = Buffer.from(image.split(',')[1] || image, 'base64');
    const faceMatch = await verifyFace(imageBuffer, req.user.faceDescriptor);

    if (!faceMatch) {
      return res.status(401).json({
        success: false,
        message: 'Face verification failed. Please ensure you are the registered student.'
      });
    }

    // Optional: Verify location if provided
    if (location && session.location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.location.latitude,
        session.location.longitude
      );
      // Allow 100 meters radius
      if (distance > 100) {
        return res.status(400).json({
          success: false,
          message: 'Location mismatch. You must be at the class location to mark attendance.'
        });
      }
    }

    // Mark attendance
    session.attendance.push({
      studentId: req.user.id,
      markedAt: new Date(),
      method: 'face',
      verified: true,
      location
    });

    await session.save();

    // Create attendance record
    await AttendanceRecord.create({
      studentId: req.user.id,
      classId: session.classId,
      sessionId: session._id,
      date: new Date(),
      status: 'present',
      method: 'face',
      location,
      verified: true
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`session-${session._id}`).emit('attendance-marked', {
      studentId: req.user.id,
      studentName: req.user.name,
      method: 'face',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark attendance via QR code
// @route   POST /api/attendance/mark-qr
// @access  Private
exports.markAttendanceQR = async (req, res) => {
  try {
    const { sessionId, qrData, location } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Verify QR code
    if (!session.qrCode || !session.qrCode.code) {
      return res.status(400).json({
        success: false,
        message: 'QR code not available for this session'
      });
    }

    const verification = verifyQRCode(
      qrData,
      session.qrCode.code,
      session.qrCode.expiresAt
    );

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.message
      });
    }

    // Optional: Verify location if provided
    if (location && session.location) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        session.location.latitude,
        session.location.longitude
      );
      // Allow 100 meters radius
      if (distance > 100) {
        return res.status(400).json({
          success: false,
          message: 'Location mismatch. You must be at the class location to mark attendance.'
        });
      }
    }

    // Check if user is enrolled
    const classData = await Class.findById(session.classId);
    if (!classData.students.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Check if already marked
    const alreadyMarked = session.attendance.find(
      a => a.studentId.toString() === req.user.id
    );
    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Mark attendance
    session.attendance.push({
      studentId: req.user.id,
      markedAt: new Date(),
      method: 'qr',
      verified: true,
      location
    });

    await session.save();

    // Create attendance record
    await AttendanceRecord.create({
      studentId: req.user.id,
      classId: session.classId,
      sessionId: session._id,
      date: new Date(),
      status: 'present',
      method: 'qr',
      location,
      verified: true
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`session-${session._id}`).emit('attendance-marked', {
      studentId: req.user.id,
      studentName: req.user.name,
      method: 'qr',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark attendance via NFC
// @route   POST /api/attendance/mark-nfc
// @access  Private
exports.markAttendanceNFC = async (req, res) => {
  try {
    const { sessionId, nfcId, location } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Find user by NFC ID
    const user = await User.findOne({ nfcId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'NFC ID not found'
      });
    }

    // Check if user is enrolled
    const classData = await Class.findById(session.classId);
    if (!classData.students.includes(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Check if already marked
    const alreadyMarked = session.attendance.find(
      a => a.studentId.toString() === user._id.toString()
    );
    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Mark attendance
    session.attendance.push({
      studentId: user._id,
      markedAt: new Date(),
      method: 'nfc',
      verified: true,
      location
    });

    await session.save();

    // Create attendance record
    await AttendanceRecord.create({
      studentId: user._id,
      classId: session.classId,
      sessionId: session._id,
      date: new Date(),
      status: 'present',
      method: 'nfc',
      location,
      verified: true
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`session-${session._id}`).emit('attendance-marked', {
      studentId: user._id,
      studentName: user.name,
      method: 'nfc',
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get session details
// @route   GET /api/attendance/session/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('classId', 'name code')
      .populate('attendance.studentId', 'name email studentId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    End attendance session
// @route   PUT /api/attendance/session/:id/end
// @access  Private (Faculty)
exports.endSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.facultyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`session-${session._id}`).emit('session-ended', session);

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance reports
// @route   GET /api/attendance/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query;

    let query = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await AttendanceRecord.find(query)
      .populate('studentId', 'name email studentId')
      .populate('classId', 'name code')
      .populate('sessionId', 'sessionType verificationMethod')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

