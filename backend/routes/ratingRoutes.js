const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin, student } = require('../middleware/authMiddleware');

// Import models directly for database operations
// Note: RatingQuestion is now embedded within RatingPeriod
const { RatingPeriod, StudentRating } = require('../models/ratingModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');

// RATING PERIOD ROUTES WITH EMBEDDED QUESTIONS
// Create a rating period with embedded questions
router.post('/periods', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { title, description, startDate, endDate, targetType, schools, directions, questions } = req.body;

    // Validation
    if (!title || !startDate || !endDate) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }
    
    // Convert dates from strings if needed
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date range
    if (start >= end) {
      res.status(400);
      throw new Error('End date must be after start date');
    }

    // Create rating period with embedded questions
    const ratingPeriod = await RatingPeriod.create({
      title,
      description,
      startDate: start,
      endDate: end,
      targetType: targetType || 'both',
      schools: schools || [],
      directions: directions || [],
      isActive: false, // Default to inactive until explicitly activated
      questions: questions || [], // Include embedded questions from the request
      createdBy: req.user._id
    });

    if (ratingPeriod) {
      res.status(201).json(ratingPeriod);
    } else {
      res.status(400);
      throw new Error('Invalid rating period data');
    }
  } catch (error) {
    console.error('Error creating rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to create rating period' });
  }
}));

// Get all rating periods
router.get('/periods', protect, admin, asyncHandler(async (req, res) => {
  try {
    // CRITICAL SECURITY FIX: Enforce school domain isolation
    // Always require school context for non-superadmin users
    if (!req.isSuperadmin && !req.schoolId) {
      console.log('⛔ SECURITY VIOLATION: Attempted to access rating periods without school context');
      res.status(403);
      throw new Error('School context required for accessing rating periods');
    }
    
    console.log(`🔒 SECURITY: Enforcing school domain isolation for rating periods`);
    
    // Build query based on school isolation
    let query = {};
    
    if (req.isSuperadmin) {
      // Superadmins can see all periods
      console.log('⚠️ SUPERADMIN: Bypassing school isolation for rating periods');
    } else {
      // Regular admins can only see periods for their school or global periods
      query = {
        $or: [
          { schools: req.schoolId },  // Periods explicitly for this school
          { 'schools.0': { $exists: false } }  // Global periods with no schools specified
        ]
      };
      console.log(`🔒 Filtering rating periods for school: ${req.schoolId}`);
    }
    
    // Find rating periods with proper school isolation
    const ratingPeriods = await RatingPeriod.find(query)
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
    console.log(`Found ${ratingPeriods.length} rating periods that match school domain isolation rules`);

    res.status(200).json(ratingPeriods);
  } catch (error) {
    console.error('Error fetching rating periods:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating periods' });
  }
}));

// Get a single rating period with its embedded questions
router.get('/periods/:id', protect, asyncHandler(async (req, res) => {
  try {
    // CRITICAL SECURITY FIX: Enforce school domain isolation
    // Always require school context for non-superadmin users
    if (!req.isSuperadmin && !req.schoolId) {
      console.log('⛔ SECURITY VIOLATION: Attempted to access single rating period without school context');
      res.status(403);
      throw new Error('School context required for accessing rating periods');
    }
    
    // Build query with security constraints
    const query = { _id: req.params.id };
    
    // Add school isolation for non-superadmins
    if (!req.isSuperadmin) {
      query.$or = [
        { schools: req.schoolId },  // Periods explicitly for this school
        { 'schools.0': { $exists: false } }  // Global periods
      ];
      console.log(`🔒 SECURITY: Enforcing school isolation for single rating period (School: ${req.schoolId})`);
    } else {
      console.log('⚠️ SUPERADMIN: Bypassing school isolation for single rating period');
    }
    
    const ratingPeriod = await RatingPeriod.findOne(query)
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('createdBy', 'name email');

    if (!ratingPeriod) {
      // Security: Use generic error message to avoid information disclosure
      console.log(`🚫 ACCESS DENIED: User attempted to access rating period outside their school domain`);
      res.status(404);
      throw new Error('Rating period not found');
    }

    res.status(200).json(ratingPeriod);
  } catch (error) {
    console.error('Error fetching rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating period' });
  }
}));

// Update a rating period including its questions
router.put('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive, targetType, schools, directions, questions } = req.body;

    const ratingPeriod = await RatingPeriod.findById(req.params.id);

    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }

    // Convert dates from strings if needed
    const start = startDate ? new Date(startDate) : ratingPeriod.startDate;
    const end = endDate ? new Date(endDate) : ratingPeriod.endDate;
    
    // Validate date range
    if (start >= end) {
      res.status(400);
      throw new Error('End date must be after start date');
    }

    // Update the rating period with all fields including questions
    ratingPeriod.title = title !== undefined ? title : ratingPeriod.title;
    ratingPeriod.description = description !== undefined ? description : ratingPeriod.description;
    ratingPeriod.startDate = start;
    ratingPeriod.endDate = end;
    ratingPeriod.isActive = isActive !== undefined ? isActive : ratingPeriod.isActive;
    ratingPeriod.targetType = targetType || ratingPeriod.targetType;
    
    // Only update schools and directions if provided
    if (schools) ratingPeriod.schools = schools;
    if (directions) ratingPeriod.directions = directions;
    
    // Update questions if provided
    if (questions) ratingPeriod.questions = questions;

    // Auto-close if end date is in the past
    const now = new Date();
    if (end < now && ratingPeriod.isActive) {
      ratingPeriod.isActive = false;
    }

    const updatedRatingPeriod = await ratingPeriod.save();

    res.status(200).json(updatedRatingPeriod);
  } catch (error) {
    console.error('Error updating rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to update rating period' });
  }
}));

// Add a question to an existing rating period
router.post('/periods/:id/questions', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order } = req.body;
    
    // Validation
    if (!text) {
      res.status(400);
      throw new Error('Question text is required');
    }
    
    const ratingPeriod = await RatingPeriod.findById(req.params.id);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Create the new question
    const newQuestion = {
      text,
      questionType: questionType || 'rating',
      targetType: targetType || 'both',
      order: order || ratingPeriod.questions.length
    };
    
    // Add to the questions array
    ratingPeriod.questions.push(newQuestion);
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(201).json(ratingPeriod);
  } catch (error) {
    console.error('Error adding question to rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to add question' });
  }
}));

// Update a specific question within a rating period
router.put('/periods/:periodId/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order } = req.body;
    
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Find the question by its ID
    const questionIndex = ratingPeriod.questions.findIndex(
      q => q._id.toString() === req.params.questionId
    );
    
    if (questionIndex === -1) {
      res.status(404);
      throw new Error('Question not found in this rating period');
    }
    
    // Update the question
    if (text) ratingPeriod.questions[questionIndex].text = text;
    if (questionType) ratingPeriod.questions[questionIndex].questionType = questionType;
    if (targetType) ratingPeriod.questions[questionIndex].targetType = targetType;
    if (order !== undefined) ratingPeriod.questions[questionIndex].order = order;
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json(ratingPeriod);
  } catch (error) {
    console.error('Error updating question in rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to update question' });
  }
}));

// Remove a question from a rating period
router.delete('/periods/:periodId/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Filter out the question to be removed
    ratingPeriod.questions = ratingPeriod.questions.filter(
      q => q._id.toString() !== req.params.questionId
    );
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json({ message: 'Question removed from rating period' });
  } catch (error) {
    console.error('Error removing question from rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to remove question' });
  }
}));

// Delete a rating period and all its embedded questions
router.delete('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.id);

    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Delete all related student ratings
    await StudentRating.deleteMany({ ratingPeriod: req.params.id });
    
    // Delete the rating period (questions are embedded, so they're deleted automatically)
    await RatingPeriod.deleteOne({ _id: ratingPeriod._id });

    res.status(200).json({ message: 'Rating period removed' });
  } catch (error) {
    console.error('Error deleting rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to delete rating period' });
  }
}));

// Get active rating periods for students
router.get('/active', protect, student, asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    
    // Get student's school and direction
    const studentSchool = req.user.school ? req.user.school._id || req.user.school : null;
    const studentDirection = req.user.direction ? req.user.direction._id || req.user.direction : null;
    
    // Find active rating periods applicable to this student
    const activePeriods = await RatingPeriod.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { schools: { $in: [studentSchool] } },
        { schools: { $size: 0 } },
        { 'schools.0': { $exists: false } }
      ],
      $or: [
        { directions: { $in: [studentDirection] } },
        { directions: { $size: 0 } },
        { 'directions.0': { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(activePeriods);
  } catch (error) {
    console.error('Error fetching active rating periods:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch active rating periods' });
  }
}));

// Get rating targets (teachers/subjects) for a student
router.get('/targets', protect, student, asyncHandler(async (req, res) => {
  try {
    const { periodId } = req.query;
    
    if (!periodId) {
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    // CRITICAL SECURITY FIX: Enforce school domain isolation
    // Always require school context for all users
    if (!req.schoolId) {
      console.log('⛔ SECURITY VIOLATION: Attempted to access rating targets without school context');
      res.status(403);
      throw new Error('School context required for accessing rating targets');
    }
    
    console.log(`🔒 SECURITY: Enforcing school isolation for rating targets (School ID: ${req.schoolId})`);
    
    // Get the rating period to check its target type
    const ratingPeriod = await RatingPeriod.findById(periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Check if the period is active
    const now = new Date();
    if (!ratingPeriod.isActive || now < ratingPeriod.startDate || now > ratingPeriod.endDate) {
      res.status(403);
      throw new Error('Rating period is not active');
    }
    
    // Get student's school and direction
    // First priority: Use schoolId from token that was set in auth middleware
    // Second priority: Extract from user object if token school not available
    const studentSchool = req.schoolId || (
      req.user.school ? 
        (typeof req.user.school === 'object' ? req.user.school._id || req.user.school : req.user.school) : 
        (req.user.schools && req.user.schools.length > 0 ? 
          (typeof req.user.schools[0] === 'object' ? req.user.schools[0]._id || req.user.schools[0] : req.user.schools[0]) : 
          null)
    );
        
    const studentDirection = req.user.direction ? 
      (typeof req.user.direction === 'object' ? req.user.direction._id || req.user.direction : req.user.direction) : 
      (req.user.directions && req.user.directions.length > 0 ? 
        (typeof req.user.directions[0] === 'object' ? req.user.directions[0]._id || req.user.directions[0] : req.user.directions[0]) : 
        null);
        
    console.log('Student school ID:', studentSchool);
    console.log('Student direction ID:', studentDirection);
    
    // Find ratings the student has already submitted for this period
    const existingRatings = await StudentRating.find({
      student: req.user._id,
      ratingPeriod: periodId
    });
    
    // Extract the IDs of already rated targets
    const ratedTeacherIds = existingRatings
      .filter(rating => rating.targetType === 'teacher')
      .map(rating => rating.targetId.toString());
      
    const ratedSubjectIds = existingRatings
      .filter(rating => rating.targetType === 'subject')
      .map(rating => rating.targetId.toString());
    
    // Initialize response object
    const response = {
      teachers: [],
      subjects: []
    };
    
    // Fetch teachers if applicable
    if (ratingPeriod.targetType === 'both' || ratingPeriod.targetType === 'teacher') {
      try {
        // Create a tiered approach with multiple queries to ensure we get some teachers
        let teachers = [];
        let queriesUsed = [];
        let teacherIds = new Set();
        
        // TIER 1: First try to get teachers from the student's subjects (most targeted approach)
        if (studentSchool || studentDirection) {
          queriesUsed.push('TIER 1: From subjects');
          // Build subject query based on what we have
          let subjectQuery = {};
          if (studentSchool) {
            subjectQuery.school = studentSchool;
          }
          if (studentDirection) {
            subjectQuery.$or = [
              { direction: studentDirection },
              { directions: studentDirection }
            ];
          }
          
          console.log('TIER 1 subjects query for teachers:', JSON.stringify(subjectQuery));
          
          // Get the student's subjects first
          const studentSubjects = await Subject.find(subjectQuery)
            .select('_id teachers');
          
          console.log(`TIER 1 found ${studentSubjects.length} subjects for student`);
          
          // Extract teacher IDs from student's subjects
          studentSubjects.forEach(subject => {
            if (subject.teachers && Array.isArray(subject.teachers)) {
              subject.teachers.forEach(teacherId => {
                teacherIds.add(teacherId.toString());
              });
            }
          });
          
          console.log(`TIER 1 found ${teacherIds.size} unique teacher IDs from student subjects`);
        }
        
        // TIER 2: If we found teachers from subjects, query those specific teachers
        if (teacherIds.size > 0) {
          queriesUsed.push('TIER 2: Specific teachers from subjects');
          const tier2Query = { 
            role: 'teacher',
            _id: { $in: Array.from(teacherIds) }
          };
          console.log('TIER 2 teacher query:', JSON.stringify(tier2Query));
          
          const tier2Results = await User.find(tier2Query).select('_id name email');
          console.log(`TIER 2 found ${tier2Results.length} teachers`); 
          teachers = [...tier2Results];
        }
        
        // TIER 3: If no teachers yet, try with school
        if (teachers.length === 0 && studentSchool) {
          queriesUsed.push('TIER 3: School teachers');
          const tier3Query = { 
            role: 'teacher',
            $or: [
              { school: studentSchool },
              { schools: studentSchool }
            ]
          };
          console.log('TIER 3 teacher query:', JSON.stringify(tier3Query));
          
          const tier3Results = await User.find(tier3Query).select('_id name email');
          console.log(`TIER 3 found ${tier3Results.length} teachers`);
          teachers = [...tier3Results];
        }
        
        // TIER 4: Last resort - find all teachers
        if (teachers.length === 0) {
          queriesUsed.push('TIER 4: All teachers');
          const tier4Query = { role: 'teacher' };
          console.log('TIER 4 teacher query:', JSON.stringify(tier4Query));
          
          const tier4Results = await User.find(tier4Query).select('_id name email');
          console.log(`TIER 4 found ${tier4Results.length} teachers`);
          teachers = [...tier4Results];
        }
        
        console.log(`Used teacher query tiers: ${queriesUsed.join(', ')}`);
        console.log(`Found ${teachers.length} total teachers before filtering rated ones`);
        
        // Filter out already rated teachers
        response.teachers = teachers.filter(teacher => 
          !ratedTeacherIds.includes(teacher._id.toString())
        );
        
        console.log(`After filtering, ${response.teachers.length} teachers remain for rating`);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        // Default to empty array on error
        response.teachers = [];
      }
    }
    
    // Fetch subjects if applicable
    if (ratingPeriod.targetType === 'both' || ratingPeriod.targetType === 'subject') {
      try {
        // CRITICAL FIX: Only show subjects the student is enrolled in
        // Get the student's enrolled subjects from their user profile
        console.log('Checking student enrollment subjects');
        
        // Ensure we have the complete user data with the subjects populated
        const studentWithSubjects = await User.findById(req.user._id)
          .select('subjects');
          
        if (!studentWithSubjects || !studentWithSubjects.subjects || !Array.isArray(studentWithSubjects.subjects)) {
          console.log('No subject enrollment data found for student');
          response.subjects = [];
          return;
        }
        
        // Get the IDs of subjects the student is enrolled in
        const enrolledSubjectIds = studentWithSubjects.subjects.map(subjectId => 
          subjectId.toString()
        );
        
        console.log(`Student is enrolled in ${enrolledSubjectIds.length} subjects: ${JSON.stringify(enrolledSubjectIds)}`);
        
        if (enrolledSubjectIds.length === 0) {
          console.log('Student is not enrolled in any subjects');
          response.subjects = [];
          return;
        }
        
        // Get the full subject data for the enrolled subjects
        const subjects = await Subject.find({
          _id: { $in: enrolledSubjectIds }
        }).select('_id name');
        
        console.log(`Found ${subjects.length} enrolled subjects for student`);
        
        // Filter out already rated subjects
        response.subjects = subjects.filter(subject => 
          !ratedSubjectIds.includes(subject._id.toString())
        );
        
        console.log(`After filtering out rated ones, ${response.subjects.length} subjects remain for rating`);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        // Default to empty array on error
        response.subjects = [];
      }
    }
    
    console.log(`Found ${response.teachers.length} teachers and ${response.subjects.length} subjects available for rating`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching rating targets:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating targets' });
  }
}));

// Check if student has already rated a target
router.get('/check/:periodId/:targetType/:targetId', protect, student, asyncHandler(async (req, res) => {
  try {
    const { periodId, targetType, targetId } = req.params;
    
    const existingRating = await StudentRating.findOne({
      student: req.user._id,
      ratingPeriod: periodId,
      targetType,
      targetId
    });
    
    res.status(200).json({
      hasRated: !!existingRating,
      ratingId: existingRating ? existingRating._id : null
    });
  } catch (error) {
    console.error('Error checking student rating:', error);
    res.status(400).json({ message: error.message || 'Failed to check rating status' });
  }
}));

// Submit a rating
router.post('/submit', protect, student, asyncHandler(async (req, res) => {
  try {
    // Handle both field naming conventions (frontend sends ratingPeriod, but our validation expected ratingPeriodId)
    const { ratingPeriod, ratingPeriodId, targetType, targetId, answers } = req.body;
    
    // CRITICAL SECURITY FIX: Enforce school domain isolation
    // Always require school context for all users
    if (!req.schoolId) {
      console.log('⛔ SECURITY VIOLATION: Attempted to submit rating without school context');
      res.status(403);
      throw new Error('School context required for submitting ratings');
    }
    
    console.log(`🔒 SECURITY: Enforcing school isolation for rating submission (School ID: ${req.schoolId})`);
    
    // Use either ratingPeriod or ratingPeriodId (frontend sends ratingPeriod)
    const periodId = ratingPeriod || ratingPeriodId;
    
    console.log('Rating submission received:', {
      periodId,
      targetType,
      targetId,
      answersCount: answers?.length || 0
    });
    
    // Validation with more detailed errors
    if (!periodId) {
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    if (!targetType) {
      res.status(400);
      throw new Error('Target type is required');
    }
    
    if (!targetId) {
      res.status(400);
      throw new Error('Target ID is required');
    }
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400);
      throw new Error('At least one answer is required');
    }
    
    // Check if rating period exists and is active
    const periodRecord = await RatingPeriod.findById(periodId);
    
    if (!periodRecord) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    const now = new Date();
    if (!periodRecord.isActive || now < periodRecord.startDate || now > periodRecord.endDate) {
      res.status(400);
      throw new Error('Rating period is not active');
    }
    
    // Check if target exists
    let targetModel;
    if (targetType === 'teacher') {
      targetModel = 'User';
      const teacher = await User.findById(targetId);
      if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
      }
    } else if (targetType === 'subject') {
      targetModel = 'Subject';
      const subject = await Subject.findById(targetId);
      if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
      }
    } else {
      res.status(400);
      throw new Error('Invalid target type');
    }
    
    // Check if student has already submitted a rating for this target in this period
    const existingRating = await StudentRating.findOne({
      student: req.user._id,
      ratingPeriod: periodId, // Use the periodId variable we defined earlier
      targetType,
      targetId
    });
    
    if (existingRating) {
      res.status(400);
      throw new Error('You have already rated this target for this period');
    }
    
    // Process and validate answers
    const processedAnswers = answers.map((answer, index) => {
      // Validate answer has required fields
      if (!answer || typeof answer !== 'object') {
        throw new Error(`Answer at index ${index} is invalid`);
      }
      
      if (!answer.question) {
        throw new Error(`Answer at index ${index} is missing the question ID`);
      }
      
      // Find the question in the rating period to get its text
      const question = periodRecord.questions.id(answer.question);
      
      if (!question) {
        throw new Error(`Question with ID ${answer.question} not found`);
      }
      
      // Validate based on question type
      if (question.questionType === 'rating') {
        // For rating questions, ensure rating value is provided and valid
        if (answer.ratingValue === undefined || answer.ratingValue === null) {
          throw new Error(`Rating value is required for question: "${question.text}"`);
        }
        
        if (typeof answer.ratingValue !== 'number' || answer.ratingValue < 1 || answer.ratingValue > 5) {
          throw new Error(`Rating value must be a number between 1 and 5 for question: "${question.text}"`);
        }
      } else if (question.questionType === 'text') {
        // For text questions, no rating value is needed, but can validate text if needed
        // We could add text validation here if required
      }
      
      return {
        questionId: answer.question,
        questionText: question.text,
        ratingValue: answer.ratingValue !== undefined ? answer.ratingValue : null,
        textAnswer: answer.textAnswer || ""
      };
    });
    
    // Extract school and direction IDs properly like we did in targets endpoint
    // First priority: Use schoolId from token that was set in auth middleware
    // Second priority: Extract from user object if token school not available
    const studentSchool = req.schoolId || (
      req.user.school ? 
        (typeof req.user.school === 'object' ? req.user.school._id || req.user.school : req.user.school) : 
        (req.user.schools && req.user.schools.length > 0 ? 
          (typeof req.user.schools[0] === 'object' ? req.user.schools[0]._id || req.user.schools[0] : req.user.schools[0]) : 
          null)
    );
        
    const studentDirection = req.user.direction ? 
      (typeof req.user.direction === 'object' ? req.user.direction._id || req.user.direction : req.user.direction) : 
      (req.user.directions && req.user.directions.length > 0 ? 
        (typeof req.user.directions[0] === 'object' ? req.user.directions[0]._id || req.user.directions[0] : req.user.directions[0]) : 
        null);

    // SECURITY: Verify the period belongs to the user's school
    if (!req.isSuperadmin) {
      const validPeriod = await RatingPeriod.findOne({ 
        _id: periodId,
        $or: [
          { schools: { $in: [req.schoolId] } },
          { 'schools.0': { $exists: false } } // Global periods
        ]
      });
      
      if (!validPeriod) {
        console.log(`🚫 SECURITY BLOCKED: User from school ${req.schoolId} attempted to submit rating for period ${periodId} from another school`);
        res.status(403);
        throw new Error('You do not have permission to submit ratings for this period');
      }
    }

    // SECURITY: Ensure the target belongs to the user's school
    if (targetType === 'teacher') {
      const teacherCheck = await User.findOne({
        _id: targetId,
        $or: [
          { schoolId: req.schoolId },
          { school: req.schoolId },
          { schools: { $in: [req.schoolId] } }
        ]
      });
      
      if (!teacherCheck) {
        console.log(`🚫 SECURITY BLOCKED: Rating submission for teacher outside school domain`);
        res.status(403);
        throw new Error('You do not have permission to rate this teacher');
      }
    } else if (targetType === 'subject') {
      const subjectCheck = await Subject.findOne({
        _id: targetId,
        $or: [
          { schoolId: req.schoolId },
          { school: req.schoolId }
        ]
      });
      
      if (!subjectCheck) {
        console.log(`🚫 SECURITY BLOCKED: Rating submission for subject outside school domain`);
        res.status(403);
        throw new Error('You do not have permission to rate this subject');
      }
    }

    // Create the new rating with ENFORCED school ID
    const studentRating = await StudentRating.create({
      student: req.user._id,
      ratingPeriod: periodId,
      targetType,
      targetId,
      targetModel: targetType === 'teacher' ? 'User' : 'Subject',
      answers: processedAnswers,
      // CRITICAL SECURITY: Always use req.schoolId to enforce domain isolation
      school: req.schoolId || studentSchool,
      direction: studentDirection
    });
    
    res.status(201).json(studentRating);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(400).json({ message: error.message || 'Failed to submit rating' });
  }
}));

// Get rating statistics for a target
router.get('/stats/:targetType/:targetId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { periodId } = req.query;
    
    console.log(`Getting rating statistics for ${targetType} with ID ${targetId}`);
    
    // Build the query
    const query = {
      targetType,
      targetId
    };
    
    // If period ID is provided, filter by that specific period
    if (periodId) {
      query.ratingPeriod = periodId;
      console.log(`Filtering by rating period: ${periodId}`);
    }
    
    // Get all ratings for this target
    const ratings = await StudentRating.find(query)
      .populate('student', 'name');
    
    console.log(`Found ${ratings.length} ratings for this target`);
    
    // Calculate statistics
    const stats = {
      totalRatings: ratings.length,
      averageRating: 0,
      questionStats: [],
      textFeedback: [],
      periodBreakdown: {}
    };
    
    // Group ratings by question
    const questionMap = new Map();
    
    // Process all ratings
    ratings.forEach(rating => {
      // Track by period for breakdown
      const periodId = rating.ratingPeriod.toString();
      if (!stats.periodBreakdown[periodId]) {
        stats.periodBreakdown[periodId] = {
          count: 0,
          averageRating: 0,
          totalRatingValue: 0,
          ratingCount: 0
        };
      }
      stats.periodBreakdown[periodId].count++;
      
      // Process each answer in the rating
      rating.answers.forEach(answer => {
        const questionId = answer.questionId.toString();
        
        // Initialize question stats if not exists
        if (!questionMap.has(questionId)) {
          questionMap.set(questionId, {
            questionId,
            questionText: answer.questionText,
            totalRatingValue: 0,
            ratingCount: 0,
            averageRating: 0,
            textAnswers: []
          });
        }
        
        // Get the question stats object
        const questionStats = questionMap.get(questionId);
        
        // Add rating value if present
        if (answer.ratingValue) {
          questionStats.totalRatingValue += answer.ratingValue;
          questionStats.ratingCount++;
          
          // Add to period breakdown
          stats.periodBreakdown[periodId].totalRatingValue += answer.ratingValue;
          stats.periodBreakdown[periodId].ratingCount++;
        }
        
        // Add text feedback if present
        if (answer.textAnswer) {
          questionStats.textAnswers.push({
            student: rating.student.name,
            answer: answer.textAnswer,
            date: rating.createdAt
          });
          
          // Also add to general text feedback
          stats.textFeedback.push({
            question: answer.questionText,
            student: rating.student.name,
            answer: answer.textAnswer,
            date: rating.createdAt
          });
        }
      });
    });
    
    // Calculate averages for each question
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    
    questionMap.forEach(questionStat => {
      if (questionStat.ratingCount > 0) {
        questionStat.averageRating = questionStat.totalRatingValue / questionStat.ratingCount;
        totalRatingSum += questionStat.totalRatingValue;
        totalRatingCount += questionStat.ratingCount;
      }
    });
    
    // Calculate overall average
    if (totalRatingCount > 0) {
      stats.averageRating = totalRatingSum / totalRatingCount;
    }
    
    // Calculate period averages
    Object.keys(stats.periodBreakdown).forEach(periodId => {
      const periodStats = stats.periodBreakdown[periodId];
      if (periodStats.ratingCount > 0) {
        periodStats.averageRating = periodStats.totalRatingValue / periodStats.ratingCount;
      }
    });
    
    // Convert question map to array
    stats.questionStats = Array.from(questionMap.values());
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching rating statistics:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating statistics' });
  }
}));

// Get rating statistics summary for all targets
router.get('/stats', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { periodId, targetType } = req.query;
    
    // CRITICAL SECURITY FIX: Enforce school domain isolation
    // Always require school context for non-superadmin users
    if (!req.isSuperadmin && !req.schoolId) {
      res.status(403);
      throw new Error('School context required for accessing rating statistics');
    }
    
    // Build the query with mandatory school isolation
    const query = {};
    
    // SECURITY: Apply school filtering for non-superadmin users
    if (!req.isSuperadmin) {
      query.school = req.schoolId;
      console.log(`🔒 SECURITY: Enforcing school isolation for ratings (School ID: ${req.schoolId})`);
    } else {
      console.log('⚠️ SUPERADMIN: Bypassing school isolation for ratings');
    }
    
    // If period ID is provided, filter by that specific period
    if (periodId) {
      query.ratingPeriod = periodId;
      
      // SECURITY: Verify the period belongs to the user's school
      if (!req.isSuperadmin) {
        const periodSchoolCheck = await RatingPeriod.findOne({ 
          _id: periodId,
          $or: [
            { schools: { $in: [req.schoolId] } },
            { 'schools.0': { $exists: false } } // Global periods with no schools specified
          ]
        });
        
        if (!periodSchoolCheck) {
          console.log(`🚫 SECURITY BLOCKED: User from school ${req.schoolId} attempted to access period ${periodId} from another school`);
          res.status(403);
          throw new Error('You do not have permission to access this rating period');
        }
      }
    }
    
    // If target type is specified, filter by that
    if (targetType && (targetType === 'teacher' || targetType === 'subject')) {
      query.targetType = targetType;
    }
    
    console.log('Rating stats summary query:', query);
    
    // Get the rating period to get questions
    let ratingPeriod = null;
    let questions = [];
    if (periodId) {
      ratingPeriod = await RatingPeriod.findById(periodId);
      if (ratingPeriod && ratingPeriod.questions) {
        questions = ratingPeriod.questions;
        console.log(`Found ${questions.length} questions in rating period:`, 
          questions.map(q => ({ id: q._id.toString(), text: q.text.substring(0, 30) })));
      }
    }
    
    // Get all ratings matching the criteria
    const ratings = await StudentRating.find(query);
    console.log(`Found ${ratings.length} total ratings`);
    
    // Log sample of the first rating to understand structure
    if (ratings.length > 0) {
      const sampleRating = ratings[0];
      console.log('Sample rating structure:', {
        id: sampleRating._id.toString(),
        targetType: sampleRating.targetType,
        targetId: sampleRating.targetId.toString(),
        answers: sampleRating.answers.map(a => ({
          questionId: a.questionId.toString(),
          questionText: a.questionText,
          ratingValue: a.ratingValue
        }))
      });
    }
    
    // Group ratings by target
    const targetsMap = new Map();
    
    // Process all ratings
    ratings.forEach(rating => {
      const targetKey = `${rating.targetType}-${rating.targetId.toString()}`;
      
      // Initialize target stats if not exists
      if (!targetsMap.has(targetKey)) {
        targetsMap.set(targetKey, {
          targetId: rating.targetId,
          targetType: rating.targetType,
          totalRatingValue: 0,
          ratingCount: 0,
          averageRating: 0,
          totalRatings: 0,
          name: null, // Will be populated later
          questionStats: {} // For per-question statistics
        });
      }
      
      // Get the target stats object
      const targetStats = targetsMap.get(targetKey);
      targetStats.totalRatings++;
      
      // Process each answer in the rating
      rating.answers.forEach(answer => {
        // Convert questionId to string for consistent handling
        const questionIdStr = answer.questionId.toString();
        
        // Track ALL questions including text questions (regardless of rating value)
        if (!targetStats.questionStats[questionIdStr]) {
          targetStats.questionStats[questionIdStr] = {
            questionId: questionIdStr,
            // Store the question text directly from the answer to ensure we have it
            questionText: answer.questionText || '', 
            totalValue: 0,
            count: 0,
            average: 0,
            // Track text answers separately
            hasTextResponses: answer.textAnswer ? true : false,
            textResponseCount: answer.textAnswer ? 1 : 0
          };
        } else {
          // If this answer has text, increment the text response counter
          if (answer.textAnswer) {
            targetStats.questionStats[questionIdStr].hasTextResponses = true;
            targetStats.questionStats[questionIdStr].textResponseCount++;
          }
        }
        
        // Only process rating values for rating questions
        if (answer.ratingValue) {
          targetStats.totalRatingValue += answer.ratingValue;
          targetStats.ratingCount++;
          
          const questionStat = targetStats.questionStats[questionIdStr];
          questionStat.totalValue += answer.ratingValue;
          questionStat.count++;
        }
      });
    });
    
    // Calculate averages for each target
    targetsMap.forEach(targetStat => {
      if (targetStat.ratingCount > 0) {
        targetStat.averageRating = targetStat.totalRatingValue / targetStat.ratingCount;
      }
      
      // Calculate per-question averages
      Object.values(targetStat.questionStats).forEach(qStat => {
        if (qStat.count > 0) {
          qStat.average = qStat.totalValue / qStat.count;
        }
      });
      
      // Convert question stats object to array
      targetStat.questionStats = Object.values(targetStat.questionStats);
    });
    
    // Convert targets map to array
    const targetsArray = Array.from(targetsMap.values());
    
    // Get names for teachers and subjects
    const teacherIds = targetsArray
      .filter(target => target.targetType === 'teacher')
      .map(target => target.targetId);
      
    const subjectIds = targetsArray
      .filter(target => target.targetType === 'subject')
      .map(target => target.targetId);
    
    // Get teacher names
    if (teacherIds.length > 0) {
      const teachers = await User.find({ _id: { $in: teacherIds } })
        .select('_id name');
      
      teachers.forEach(teacher => {
        const targetKey = `teacher-${teacher._id.toString()}`;
        if (targetsMap.has(targetKey)) {
          targetsMap.get(targetKey).name = teacher.name;
        }
      });
    }
    
    // Get subject names
    if (subjectIds.length > 0) {
      const subjects = await Subject.find({ _id: { $in: subjectIds } })
        .select('_id name');
      
      subjects.forEach(subject => {
        const targetKey = `subject-${subject._id.toString()}`;
        if (targetsMap.has(targetKey)) {
          targetsMap.get(targetKey).name = subject.name;
        }
      });
    }
    
    // Add question text to each question stat
    if (questions.length > 0) {
      targetsArray.forEach(target => {
        target.questionStats.forEach(qStat => {
          // Find the question in the rating period
          // Ensure both IDs are strings for proper comparison
          const question = questions.find(q => q._id.toString() === qStat.questionId.toString());
          if (question) {
            qStat.questionText = question.text || 'Unknown Question';
            qStat.questionType = question.questionType || 'rating';
            qStat.order = question.order || 0;
            
            // CRITICAL: Force detection of text questions based on both model and responses
            if (question.questionType === 'text' || qStat.hasTextResponses) {
              qStat.questionType = 'text';
              console.log(`Identified text question: ${question.text} (id: ${qStat.questionId})`);
              console.log(`Text responses: ${qStat.textResponseCount || 0}`);
            }
          } else {
            console.log(`Question not found for ID: ${qStat.questionId}`);
            // Include available question IDs for debugging
            console.log('Available question IDs:', questions.map(q => q._id.toString()));
          }
        });
        
        // Sort question stats by question order
        target.questionStats.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
    }
    
    // Convert targets map to array again with names
    const resultsArray = Array.from(targetsMap.values());
    
    // Sort by average rating (highest first)
    resultsArray.sort((a, b) => b.averageRating - a.averageRating);
    
    res.status(200).json({
      totalRatings: ratings.length,
      targets: resultsArray,
      questions: questions.map(q => ({
        _id: q._id,
        text: q.text,
        questionType: q.questionType,
        targetType: q.targetType,
        order: q.order
      })).sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  } catch (error) {
    console.error('Error fetching rating statistics summary:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating statistics summary' });
  }
}));

// Get questions for a rating period (admin access - for management)
router.get('/questions/:periodId', protect, admin, asyncHandler(async (req, res) => {
  try {
    console.log(`Admin getting questions for period ID: ${req.params.periodId}`);
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Add ratingPeriod property to each question for proper filtering in frontend
    const questionsWithPeriodId = ratingPeriod.questions.map(question => {
      const questionObj = question.toObject();
      questionObj.ratingPeriod = ratingPeriod._id;
      return questionObj;
    });
    
    console.log(`Found ${questionsWithPeriodId.length} questions for period ${ratingPeriod.title}`);
    
    // Return the questions array with added ratingPeriod property
    res.status(200).json(questionsWithPeriodId);
  } catch (error) {
    console.error('Error fetching questions for rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch questions' });
  }
}));

// Get questions for a rating period (student access - for submitting ratings)
router.get('/period/:periodId/questions', protect, student, asyncHandler(async (req, res) => {
  try {
    console.log(`Student getting questions for period ID: ${req.params.periodId}`);
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Check if the rating period is active
    const now = new Date();
    if (!ratingPeriod.isActive || now < ratingPeriod.startDate || now > ratingPeriod.endDate) {
      res.status(403);
      throw new Error('Rating period is not active');
    }
    
    // Add ratingPeriod property to each question for proper filtering in frontend
    const questionsWithPeriodId = ratingPeriod.questions.map(question => {
      const questionObj = question.toObject();
      questionObj.ratingPeriod = ratingPeriod._id;
      return questionObj;
    });
    
    console.log(`Student found ${questionsWithPeriodId.length} questions for period ${ratingPeriod.title}`);
    
    // Return the questions array with added ratingPeriod property
    res.status(200).json(questionsWithPeriodId);
  } catch (error) {
    console.error('Error fetching questions for rating period (student):', error);
    res.status(400).json({ message: error.message || 'Failed to fetch questions' });
  }
}));

// Update a question (endpoint matching frontend API call pattern)
router.put('/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order, ratingPeriod: periodId } = req.body;
    
    if (!periodId) {
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    const ratingPeriod = await RatingPeriod.findById(periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Find the question by its ID
    const questionIndex = ratingPeriod.questions.findIndex(
      q => q._id.toString() === req.params.questionId
    );
    
    if (questionIndex === -1) {
      res.status(404);
      throw new Error('Question not found in this rating period');
    }
    
    // Update the question
    if (text) ratingPeriod.questions[questionIndex].text = text;
    if (questionType) ratingPeriod.questions[questionIndex].questionType = questionType;
    if (targetType) ratingPeriod.questions[questionIndex].targetType = targetType;
    if (order !== undefined) ratingPeriod.questions[questionIndex].order = order;
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    // Return the updated question
    res.status(200).json(ratingPeriod.questions[questionIndex]);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(400).json({ message: error.message || 'Failed to update question' });
  }
}));

// Delete a question (endpoint matching frontend API call pattern)
router.delete('/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    // We need to find which rating period contains this question
    const ratingPeriods = await RatingPeriod.find({
      'questions._id': req.params.questionId
    });
    
    if (ratingPeriods.length === 0) {
      res.status(404);
      throw new Error('Question not found');
    }
    
    const ratingPeriod = ratingPeriods[0];
    
    // Filter out the question to be removed
    ratingPeriod.questions = ratingPeriod.questions.filter(
      q => q._id.toString() !== req.params.questionId
    );
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json({ message: 'Question removed successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(400).json({ message: error.message || 'Failed to delete question' });
  }
}));

// Create a new rating question (endpoint matching frontend API call pattern)
router.post('/questions', protect, admin, asyncHandler(async (req, res) => {
  try {
    console.log('POST /questions request received with body:', req.body);
    const { text, questionType, targetType, order, ratingPeriod: periodId } = req.body;
    
    // Validation
    if (!text) {
      console.log('Question text is missing');
      res.status(400);
      throw new Error('Question text is required');
    }
    
    if (!periodId) {
      console.log('Rating period ID is missing');
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    console.log(`Looking for rating period with ID: ${periodId}`);
    const ratingPeriod = await RatingPeriod.findById(periodId);
    
    if (!ratingPeriod) {
      console.log(`Rating period not found with ID: ${periodId}`);
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    console.log('Found rating period:', ratingPeriod.title);
    
    // Create the new question
    const newQuestion = {
      text,
      questionType: questionType || 'rating',
      targetType: targetType || 'both',
      order: order !== undefined ? order : ratingPeriod.questions.length
    };
    
    console.log('Adding new question:', newQuestion);
    
    // Add to the questions array
    ratingPeriod.questions.push(newQuestion);
    
    // Save the updated rating period
    const updatedPeriod = await ratingPeriod.save();
    
    // Return the newly created question (the last one in the array)
    const createdQuestion = updatedPeriod.questions[updatedPeriod.questions.length - 1];
    
    console.log('Successfully created question:', createdQuestion);
    res.status(201).json(createdQuestion);
  } catch (error) {
    console.error('Error adding question to rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to add question' });
  }
}));

module.exports = router;
// End of file
