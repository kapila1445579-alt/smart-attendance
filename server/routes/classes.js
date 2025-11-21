const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @desc    Get all classes
// @route   GET /api/classes
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.students = req.user.id;
    } else if (req.user.role === 'faculty') {
      query.faculty = req.user.id;
    }

    const classes = await Class.find(query)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId');

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single class
// @route   GET /api/classes/:id
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('students', 'name email studentId');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create class
// @route   POST /api/classes
router.post('/', authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { name, code, students, schedule } = req.body;

    const classData = await Class.create({
      name,
      code,
      faculty: req.user.id,
      students: students || [],
      schedule
    });

    res.status(201).json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update class
// @route   PUT /api/classes/:id
router.put('/:id', authorize('faculty', 'admin'), async (req, res) => {
  try {
    let classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if faculty owns the class
    if (classData.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    classData = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

