const asyncHandler = require('express-async-handler');
const Grade = require('../models/gradeModel');
const User = require('../models/userModel');
const Class = require('../models/classModel');

// @desc    Get student grade analysis for a specific period
// @route   GET /api/grades/student-period-analysis
// @access  Private (Admin: all students, Teacher: only shared students)
const getStudentPeriodAnalysis = asyncHandler(async (req, res) => {
  try {
    const { studentId, period } = req.query;
    
    console.log(`[GradeAnalysis] Request from ${req.user.role}:`, { 
      studentId, 
      period, 
      requesterId: req.user._id 
    });

    if (!studentId || !period) {
      res.status(400);
      throw new Error('Student ID and period are required');
    }

    // Verify student exists and user has permission to view
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      res.status(404);
      throw new Error('Student not found');
    }

    // Check permission - admin can see all, teacher only their students
    if (req.user.role === 'teacher') {
      // Check if teacher teaches this student (through classes)
      const sharedClasses = await Class.find({
        teacher: req.user._id,
        students: studentId,
        schoolId: req.user.schoolId
      });

      if (sharedClasses.length === 0) {
        res.status(403);
        throw new Error('Access denied - you do not teach this student');
      }
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate = now;

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_semester':
        // Assuming September-January is first semester, February-June is second
        const currentMonth = now.getMonth();
        if (currentMonth >= 8 || currentMonth <= 0) { // Sept-Jan
          startDate = new Date(now.getFullYear(), 8, 1); // September 1st
        } else { // Feb-June
          startDate = new Date(now.getFullYear(), 1, 1); // February 1st
        }
        break;
      case 'last_semester':
        const lastSemesterMonth = now.getMonth();
        if (lastSemesterMonth >= 8 || lastSemesterMonth <= 0) { // Currently Sept-Jan, show Feb-June
          startDate = new Date(now.getFullYear(), 1, 1);
          endDate = new Date(now.getFullYear(), 6, 30);
        } else { // Currently Feb-June, show last Sept-Jan
          startDate = new Date(now.getFullYear() - 1, 8, 1);
          endDate = new Date(now.getFullYear(), 0, 31);
        }
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 8, 1); // Academic year starts September
        break;
      case 'all_time':
        startDate = new Date('2020-01-01'); // Far back date
        break;
      default:
        res.status(400);
        throw new Error('Invalid period specified');
    }

    console.log(`[GradeAnalysis] Date range:`, { startDate, endDate });

    // Get all grades for student in the specified period
    const studentGrades = await Grade.find({
      student: studentId,
      schoolId: req.user.schoolId,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('subject', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });

    console.log(`[GradeAnalysis] Found ${studentGrades.length} grades for student`);

    if (studentGrades.length === 0) {
      return res.status(200).json({
        student,
        period,
        dateRange: { startDate, endDate },
        subjectAnalysis: {},
        totalGrades: 0,
        message: 'No grades found for the selected period'
      });
    }

    // Group grades by subject
    const subjectGroups = {};
    studentGrades.forEach(grade => {
      const subjectName = grade.subject?.name || 'Unknown Subject';
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = [];
      }
      subjectGroups[subjectName].push(grade);
    });

    // Calculate analysis for each subject
    const subjectAnalysis = {};
    
    for (const [subjectName, grades] of Object.entries(subjectGroups)) {
      console.log(`[GradeAnalysis] Processing subject: ${subjectName} with ${grades.length} grades`);
      
      // Get subject ID for class average calculation
      const subjectId = grades[0].subject?._id;
      
      // Calculate student average for this subject
      const gradeValues = grades.map(g => g.value);
      const studentAverage = gradeValues.reduce((sum, val) => sum + val, 0) / gradeValues.length;

      // Calculate class average for this subject in the same period
      let classAverage = 0;
      if (subjectId) {
        const classGrades = await Grade.find({
          subject: subjectId,
          schoolId: req.user.schoolId,
          date: { $gte: startDate, $lte: endDate }
        });
        
        if (classGrades.length > 0) {
          const classGradeValues = classGrades.map(g => g.value);
          classAverage = classGradeValues.reduce((sum, val) => sum + val, 0) / classGradeValues.length;
        }
      }

      subjectAnalysis[subjectName] = {
        grades: grades.map(grade => ({
          value: grade.value,
          date: grade.date,
          description: grade.description,
          teacher: {
            name: grade.teacher?.name || 'Unknown'
          }
        })),
        studentAverage,
        classAverage,
        gradeCount: grades.length,
        highestGrade: Math.max(...gradeValues),
        lowestGrade: Math.min(...gradeValues)
      };

      console.log(`[GradeAnalysis] Subject ${subjectName}: student avg ${studentAverage.toFixed(2)}, class avg ${classAverage.toFixed(2)}`);
    }

    // Prepare response
    const response = {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email
      },
      period,
      dateRange: { startDate, endDate },
      subjectAnalysis,
      totalGrades: studentGrades.length,
      summary: {
        subjectsCount: Object.keys(subjectAnalysis).length,
        overallAverage: Object.values(subjectAnalysis).reduce((sum, subject) => sum + subject.studentAverage, 0) / Object.keys(subjectAnalysis).length
      }
    };

    console.log(`[GradeAnalysis] Returning analysis for ${Object.keys(subjectAnalysis).length} subjects`);
    res.status(200).json(response);

  } catch (error) {
    console.error('[GradeAnalysis] Error in getStudentPeriodAnalysis:', error);
    res.status(500);
    throw new Error('Error retrieving student grade analysis');
  }
});

module.exports = {
  getStudentPeriodAnalysis
};
