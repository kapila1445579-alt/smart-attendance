const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const Class = require('../models/Class');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get class attendance analytics
// @route   GET /api/analytics/class/:classId
// @access  Private
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Total sessions
    const totalSessions = await AttendanceSession.countDocuments({
      classId,
      status: 'completed',
      ...(startDate || endDate ? {
        startTime: dateFilter.date
      } : {})
    });

    // Total students
    const totalStudents = classData.students.length;

    // Attendance records
    const records = await AttendanceRecord.find({
      classId,
      ...dateFilter
    });

    // Calculate statistics
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;

    // Student-wise attendance
    const studentStats = {};
    classData.students.forEach(studentId => {
      const studentRecords = records.filter(
        r => r.studentId.toString() === studentId.toString()
      );
      const present = studentRecords.filter(r => r.status === 'present').length;
      const total = studentRecords.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      studentStats[studentId.toString()] = {
        present,
        absent: total - present,
        total,
        percentage: percentage.toFixed(2)
      };
    });

    // Method-wise statistics
    const methodStats = {
      face: records.filter(r => r.method === 'face').length,
      qr: records.filter(r => r.method === 'qr').length,
      nfc: records.filter(r => r.method === 'nfc').length
    };

    res.status(200).json({
      success: true,
      data: {
        class: {
          id: classData._id,
          name: classData.name,
          code: classData.code
        },
        summary: {
          totalSessions,
          totalStudents,
          totalRecords: records.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          overallPercentage: totalSessions > 0 
            ? ((presentCount / (totalSessions * totalStudents)) * 100).toFixed(2)
            : 0
        },
        methodStats,
        studentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student attendance analytics
// @route   GET /api/analytics/student/:studentId
// @access  Private
exports.getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, startDate, endDate } = req.query;

    let query = { studentId };
    if (classId) query.classId = classId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await AttendanceRecord.find(query)
      .populate('classId', 'name code')
      .populate('sessionId', 'sessionType startTime')
      .sort({ date: -1 });

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate statistics
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    // Class-wise breakdown
    const classBreakdown = {};
    records.forEach(record => {
      const classId = record.classId._id.toString();
      if (!classBreakdown[classId]) {
        classBreakdown[classId] = {
          className: record.classId.name,
          classCode: record.classId.code,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      classBreakdown[classId].total++;
      if (record.status === 'present') classBreakdown[classId].present++;
      else if (record.status === 'absent') classBreakdown[classId].absent++;
      else if (record.status === 'late') classBreakdown[classId].late++;
    });

    // Calculate percentages for each class
    Object.keys(classBreakdown).forEach(classId => {
      const stats = classBreakdown[classId];
      stats.percentage = stats.total > 0 
        ? ((stats.present / stats.total) * 100).toFixed(2)
        : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId
        },
        summary: {
          total,
          present,
          absent,
          late,
          percentage: percentage.toFixed(2)
        },
        classBreakdown: Object.values(classBreakdown),
        recentRecords: records.slice(0, 20)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get overall analytics
// @route   GET /api/analytics/overall
// @access  Private (Admin/Faculty)
exports.getOverallAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const totalSessions = await AttendanceSession.countDocuments({
      status: 'completed',
      ...(startDate || endDate ? {
        startTime: dateFilter.date
      } : {})
    });

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClasses = await Class.countDocuments();

    const records = await AttendanceRecord.find(dateFilter);
    const presentCount = records.filter(r => r.status === 'present').length;
    const totalRecords = records.length;
    const overallPercentage = totalRecords > 0 
      ? ((presentCount / totalRecords) * 100).toFixed(2)
      : 0;

    // Daily attendance trend
    const dailyTrend = {};
    records.forEach(record => {
      const date = record.date.toISOString().split('T')[0];
      if (!dailyTrend[date]) {
        dailyTrend[date] = { present: 0, total: 0 };
      }
      dailyTrend[date].total++;
      if (record.status === 'present') {
        dailyTrend[date].present++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSessions,
          totalStudents,
          totalClasses,
          totalRecords,
          presentCount,
          overallPercentage
        },
        dailyTrend: Object.entries(dailyTrend).map(([date, stats]) => ({
          date,
          present: stats.present,
          total: stats.total,
          percentage: stats.total > 0 
            ? ((stats.present / stats.total) * 100).toFixed(2)
            : 0
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

