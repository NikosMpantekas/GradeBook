const asyncHandler = require('express-async-handler');
const Grade = require('../models/gradeModel');
const User = require('../models/userModel');
const Class = require('../models/classModel');

// @desc    Get student statistics with grade averages and counts
// @route   GET /api/stats/students
// @access  Private (Admin: all students, Teacher: only shared students)
const getStudentStats = asyncHandler(async (req, res) => {
  try {
    const { search } = req.query;
    console.log(`[StudentStats] Request from ${req.user.role}:`, { search, schoolId: req.user.schoolId });

    // Build base query for students in the same school
    let studentQuery = {
      role: 'student',
      schoolId: req.user.schoolId
    };

    // Add search filter if provided
    if (search && search.trim()) {
      studentQuery.name = { $regex: search.trim(), $options: 'i' };
    }

    let students;
    
    if (req.user.role === 'admin') {
      // Admin can see all students in their school
      console.log('[StudentStats] Admin access - fetching all students');
      students = await User.find(studentQuery).select('_id name email');
    } else if (req.user.role === 'teacher') {
      // Teacher can only see students from their assigned classes
      console.log('[StudentStats] Teacher access - fetching students from assigned classes');
      
      // First find all classes where this teacher is assigned
      const teacherClasses = await Class.find({
        teachers: req.user._id,
        schoolId: req.user.schoolId
      }).select('students');
      
      // Extract unique student IDs from all classes
      const studentIds = [...new Set(
        teacherClasses.flatMap(cls => cls.students.map(id => id.toString()))
      )];
      
      console.log(`[StudentStats] Teacher has access to ${studentIds.length} students from classes`);
      
      // Add student ID filter to the query
      studentQuery._id = { $in: studentIds };
      
      students = await User.find(studentQuery).select('_id name email');
    } else {
      res.status(403);
      throw new Error('Not authorized to view student statistics');
    }

    console.log(`[StudentStats] Found ${students.length} students matching criteria`);

    // Calculate statistics for each student
    const studentStats = await Promise.all(
      students.map(async (student) => {
        // Get all grades for this student
        const grades = await Grade.find({
          student: student._id,
          schoolId: req.user.schoolId
        }).populate('subject', 'name');

        // Calculate statistics
        const gradeCount = grades.length;
        const gradeValues = grades.map(g => g.value);
        const averageGrade = gradeCount > 0 
          ? Math.round((gradeValues.reduce((sum, val) => sum + val, 0) / gradeCount) * 100) / 100
          : 0;

        // Get subject breakdown
        const subjectStats = {};
        grades.forEach(grade => {
          const subjectName = grade.subject?.name || 'Unknown Subject';
          if (!subjectStats[subjectName]) {
            subjectStats[subjectName] = {
              count: 0,
              total: 0,
              average: 0
            };
          }
          subjectStats[subjectName].count++;
          subjectStats[subjectName].total += grade.value;
        });

        // Calculate averages for each subject
        Object.keys(subjectStats).forEach(subject => {
          const stats = subjectStats[subject];
          stats.average = Math.round((stats.total / stats.count) * 100) / 100;
        });

        // Find highest and lowest grades
        const highestGrade = gradeCount > 0 ? Math.max(...gradeValues) : 0;
        const lowestGrade = gradeCount > 0 ? Math.min(...gradeValues) : 0;

        return {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email
          },
          statistics: {
            gradeCount,
            averageGrade,
            highestGrade,
            lowestGrade,
            subjectStats
          }
        };
      })
    );

    // Sort by student name
    studentStats.sort((a, b) => a.student.name.localeCompare(b.student.name));

    console.log(`[StudentStats] Calculated statistics for ${studentStats.length} students`);

    res.status(200).json({
      students: studentStats,
      total: studentStats.length,
      searchTerm: search || null
    });

  } catch (error) {
    console.error('[StudentStats] Error:', error);
    res.status(500);
    throw new Error('Error retrieving student statistics');
  }
});

// @desc    Get detailed statistics for a specific student
// @route   GET /api/stats/students/:id
// @access  Private (Admin: any student, Teacher: only shared students)
const getStudentDetailedStats = asyncHandler(async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`[StudentStats] Detailed stats request for student ${studentId} from ${req.user.role}`);

    // Verify student exists and access rights
    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      schoolId: req.user.schoolId
    }).select('_id name email');

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Check teacher access rights
    if (req.user.role === 'teacher') {
      const teacherClasses = await Class.find({
        teachers: req.user._id,
        students: studentId,
        schoolId: req.user.schoolId
      });

      if (teacherClasses.length === 0) {
        res.status(403);
        throw new Error('Not authorized to view this student\'s statistics');
      }
    }

    // Get all grades for this student with full details
    const grades = await Grade.find({
      student: studentId,
      schoolId: req.user.schoolId
    })
    .populate('subject', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });

    // Calculate detailed statistics
    const gradeCount = grades.length;
    const gradeValues = grades.map(g => g.value);
    const averageGrade = gradeCount > 0 
      ? Math.round((gradeValues.reduce((sum, val) => sum + val, 0) / gradeCount) * 100) / 100
      : 0;

    // Monthly progress (last 12 months)
    const monthlyStats = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[monthKey] = { count: 0, total: 0, average: 0 };
    }

    grades.forEach(grade => {
      const gradeDate = new Date(grade.date);
      const monthKey = `${gradeDate.getFullYear()}-${String(gradeDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].count++;
        monthlyStats[monthKey].total += grade.value;
      }
    });

    // Calculate monthly averages
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      if (stats.count > 0) {
        stats.average = Math.round((stats.total / stats.count) * 100) / 100;
      }
    });

    // Subject breakdown with detailed stats
    const subjectStats = {};
    grades.forEach(grade => {
      const subjectName = grade.subject?.name || 'Unknown Subject';
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = {
          count: 0,
          total: 0,
          average: 0,
          highest: 0,
          lowest: 100,
          grades: []
        };
      }
      const stats = subjectStats[subjectName];
      stats.count++;
      stats.total += grade.value;
      stats.highest = Math.max(stats.highest, grade.value);
      stats.lowest = Math.min(stats.lowest, grade.value);
      stats.grades.push({
        value: grade.value,
        date: grade.date,
        teacher: grade.teacher?.name || 'Unknown Teacher',
        description: grade.description
      });
    });

    // Calculate subject averages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.average = Math.round((stats.total / stats.count) * 100) / 100;
      // Sort grades by date (newest first)
      stats.grades.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    res.status(200).json({
      student,
      overview: {
        gradeCount,
        averageGrade,
        highestGrade: gradeCount > 0 ? Math.max(...gradeValues) : 0,
        lowestGrade: gradeCount > 0 ? Math.min(...gradeValues) : 0
      },
      monthlyProgress: monthlyStats,
      subjectBreakdown: subjectStats,
      recentGrades: grades.slice(0, 10) // Last 10 grades
    });

  } catch (error) {
    console.error('[StudentStats] Error in detailed stats:', error);
    res.status(500);
    throw new Error('Error retrieving detailed student statistics');
  }
});

module.exports = {
  getStudentStats,
  getStudentDetailedStats
};
