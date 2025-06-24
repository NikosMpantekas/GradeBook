const asyncHandler = require('express-async-handler');
const Class = require('../models/classModel');
const User = require('../models/userModel');

// @desc    Get schedule for a user (student, teacher, or admin)
// @route   GET /api/schedule
// @access  Private
const getSchedule = asyncHandler(async (req, res) => {
  console.log(`======= SCHEDULE REQUEST =======`);
  console.log(`getSchedule called for user: ${req.user._id} (${req.user.role})`);
  console.log(`School ID: ${req.user.schoolId}`);
  console.log('Query parameters:', req.query);
  
  const { schoolBranch, teacherId } = req.query;
  
  try {
    let classes = [];
    
    if (req.user.role === 'student') {
      // Find classes where the student is enrolled
      classes = await Class.find({
        schoolId: req.user.schoolId,
        students: req.user._id,
        active: true
      })
      .populate('teachers', 'name email')
      .lean();
      
      console.log(`Found ${classes.length} classes for student ${req.user._id}`);
      
    } else if (req.user.role === 'teacher') {
      // Build filter for teacher
      const teacherFilter = {
        schoolId: req.user.schoolId,
        teachers: req.user._id,
        active: true
      };
      
      // Add school branch filter if provided
      if (schoolBranch) {
        teacherFilter.schoolBranch = schoolBranch;
      }
      
      // Find classes where the teacher is assigned
      classes = await Class.find(teacherFilter)
      .populate('students', 'name email')
      .lean();
      
      console.log(`Found ${classes.length} classes for teacher ${req.user._id} with filters:`, teacherFilter);
      
    } else if (req.user.role === 'admin') {
      // Build filter for admin
      const adminFilter = {
        schoolId: req.user.schoolId,
        active: true
      };
      
      // Add school branch filter if provided
      if (schoolBranch) {
        adminFilter.schoolBranch = schoolBranch;
      }
      
      // Add teacher filter if provided
      if (teacherId) {
        adminFilter.teachers = teacherId;
      }
      
      // Admin can see all classes in their school
      classes = await Class.find(adminFilter)
      .populate('teachers', 'name email')
      .populate('students', 'name email')
      .lean();
      
      console.log(`Found ${classes.length} classes for admin in school ${req.user.schoolId} with filters:`, adminFilter);
    }
    
    // Transform classes into schedule format
    const scheduleData = transformClassesToSchedule(classes, req.user.role);
    
    res.json({
      success: true,
      schedule: scheduleData,
      totalClasses: classes.length
    });
    
  } catch (error) {
    console.error('Error in getSchedule:', error);
    res.status(500);
    throw new Error('Failed to get schedule: ' + error.message);
  }
});

// @desc    Get schedule for a specific student (admin/teacher only)
// @route   GET /api/schedule/student/:studentId
// @access  Private/Admin/Teacher
const getStudentSchedule = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  console.log(`getStudentSchedule called for student: ${studentId} by user: ${req.user._id} (${req.user.role})`);
  
  try {
    // Verify the student exists and is in the same school
    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      schoolId: req.user.schoolId
    });
    
    if (!student) {
      res.status(404);
      throw new Error('Student not found in your school');
    }
    
    // For teachers, verify they teach this student
    if (req.user.role === 'teacher') {
      const hasAccess = await Class.findOne({
        schoolId: req.user.schoolId,
        teachers: req.user._id,
        students: studentId,
        active: true
      });
      
      if (!hasAccess) {
        res.status(403);
        throw new Error('You do not have access to this student\'s schedule');
      }
    }
    
    // Find classes for this student
    const classes = await Class.find({
      schoolId: req.user.schoolId,
      students: studentId,
      active: true
    })
    .populate('teachers', 'name email')
    .lean();
    
    const scheduleData = transformClassesToSchedule(classes, 'student');
    
    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email
      },
      schedule: scheduleData,
      totalClasses: classes.length
    });
    
  } catch (error) {
    console.error('Error in getStudentSchedule:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to get student schedule');
  }
});

// @desc    Get schedule for a specific teacher (admin only)
// @route   GET /api/schedule/teacher/:teacherId
// @access  Private/Admin
const getTeacherSchedule = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  console.log(`getTeacherSchedule called for teacher: ${teacherId} by admin: ${req.user._id}`);
  
  try {
    // Verify the teacher exists and is in the same school
    const teacher = await User.findOne({
      _id: teacherId,
      role: 'teacher',
      schoolId: req.user.schoolId
    });
    
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found in your school');
    }
    
    // Find classes for this teacher
    const classes = await Class.find({
      schoolId: req.user.schoolId,
      teachers: teacherId,
      active: true
    })
    .populate('students', 'name email')
    .lean();
    
    const scheduleData = transformClassesToSchedule(classes, 'teacher');
    
    res.json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email
      },
      schedule: scheduleData,
      totalClasses: classes.length
    });
    
  } catch (error) {
    console.error('Error in getTeacherSchedule:', error);
    res.status(500);
    throw new Error('Failed to get teacher schedule: ' + error.message);
  }
});

// Helper function to transform classes data into weekly schedule format
const transformClassesToSchedule = (classes, userRole) => {
  console.log(`Transforming ${classes.length} classes to schedule format for role: ${userRole}`);
  
  // Log class data summary for debugging
  if (classes.length > 0) {
    console.log('Class data sample:', {
      _id: classes[0]._id,
      name: classes[0].name,
      subject: classes[0].subject,
      hasSchedule: Boolean(classes[0].schedule),
      scheduleLength: classes[0].schedule ? classes[0].schedule.length : 0,
      teachersLength: classes[0].teachers ? classes[0].teachers.length : 0,
      studentsLength: classes[0].students ? classes[0].students.length : 0,
    });
  } else {
    console.log('No classes found to transform');
  }
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const schedule = {};
  let totalScheduleItems = 0;
  
  // Initialize empty schedule
  daysOfWeek.forEach(day => {
    schedule[day] = [];
  });
  
  // Process each class and its schedule
  classes.forEach((cls, index) => {
    // Validate class object
    if (!cls) {
      console.warn(`Class at index ${index} is undefined or null`);
      return;
    }
    
    // Validate schedule property
    if (!cls.schedule) {
      console.warn(`Class ${cls._id} (${cls.name}) has no schedule property`);
      return;
    }
    
    if (!Array.isArray(cls.schedule)) {
      console.warn(`Class ${cls._id} (${cls.name}) schedule is not an array`);
      return;
    }
    
    // Log class debug info if it has a schedule
    if (cls.schedule.length === 0) {
      console.warn(`Class ${cls._id} (${cls.name}) has empty schedule array`);
      return;
    } else {
      console.log(`Processing class ${cls.name} (${cls._id}) with ${cls.schedule.length} schedule items`);
    }
    
    // Process each schedule item
    cls.schedule.forEach(scheduleItem => {
      // Validate schedule item
      if (!scheduleItem) {
        console.warn(`Schedule item in class ${cls._id} is undefined or null`);
        return;
      }
      
      if (!scheduleItem.day) {
        console.warn(`Schedule item in class ${cls._id} missing day property`);
        return;
      }
      
      if (!scheduleItem.startTime || !scheduleItem.endTime) {
        console.warn(`Schedule item in class ${cls._id} missing time properties`);
        return;
      }
      
      // Ensure day is valid
      if (!daysOfWeek.includes(scheduleItem.day)) {
        console.warn(`Invalid day '${scheduleItem.day}' in class ${cls._id}`);
        return;
      }
      
      if (schedule[scheduleItem.day]) {
        const classInfo = {
          _id: `${cls._id}-${scheduleItem.day}-${scheduleItem.startTime}`, // Create a unique ID
          classId: cls._id,
          className: cls.name,
          subject: cls.subject || "Unknown Subject",
          direction: cls.direction || "",
          schoolBranch: cls.schoolBranch || "",
          startTime: scheduleItem.startTime,
          endTime: scheduleItem.endTime,
          day: scheduleItem.day
        };
        
        // Add role-specific information
        if (userRole === 'student') {
          classInfo.teachers = cls.teachers || [];
          classInfo.teacherNames = Array.isArray(cls.teachers) ? 
            cls.teachers.map(t => (typeof t === 'object' && t.name) ? t.name : t) : [];
        } else if (userRole === 'teacher') {
          classInfo.students = cls.students || [];
          classInfo.studentCount = Array.isArray(cls.students) ? cls.students.length : 0;
          classInfo.studentNames = Array.isArray(cls.students) ? 
            cls.students.map(s => (typeof s === 'object' && s.name) ? s.name : s) : [];
        } else if (userRole === 'admin') {
          classInfo.teachers = cls.teachers || [];
          classInfo.students = cls.students || [];
          classInfo.teacherCount = Array.isArray(cls.teachers) ? cls.teachers.length : 0;
          classInfo.studentCount = Array.isArray(cls.students) ? cls.students.length : 0;
          classInfo.teacherNames = Array.isArray(cls.teachers) ? 
            cls.teachers.map(t => (typeof t === 'object' && t.name) ? t.name : t) : [];
          classInfo.studentNames = Array.isArray(cls.students) ? 
            cls.students.map(s => (typeof s === 'object' && s.name) ? s.name : s) : [];
        }
        
        schedule[scheduleItem.day].push(classInfo);
        totalScheduleItems++;
      }
    });
  });
  
  // Sort each day's classes by start time
  daysOfWeek.forEach(day => {
    schedule[day].sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    
    console.log(`Day ${day}: ${schedule[day].length} events added to schedule`);
  });
  
  console.log(`Transformation complete: ${totalScheduleItems} total events across all days`);
  return schedule;
};

module.exports = {
  getSchedule,
  getStudentSchedule,
  getTeacherSchedule
};
