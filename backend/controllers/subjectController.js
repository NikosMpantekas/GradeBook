const asyncHandler = require('express-async-handler');
const Subject = require('../models/subjectModel');
const User = require('../models/userModel');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
  const { name, description, teachers, directions } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a subject name');
  }

  try {
    // Extract schoolId from user or request
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    if (!schoolId && req.user.role !== 'superadmin') {
      res.status(400);
      throw new Error('School ID is required');
    }
    
    // Check if subject already exists in this school
    const existingSubject = await Subject.findOne({
      name: name,
      schoolId: schoolId
    });
    
    if (existingSubject) {
      res.status(400);
      throw new Error('Subject with this name already exists in this school');
    }
    
    // Create the subject with proper schoolId for multi-tenancy
    const subjectData = {
      name,
      description: description || '',
      schoolId: schoolId,
      teachers: teachers || [],
      directions: directions || []
    };
    
    // For superadmin, they might create a general subject without schoolId
    if (req.user.role === 'superadmin' && !schoolId) {
      delete subjectData.schoolId;
    }
    
    // Create the subject in the database
    const subject = await Subject.create(subjectData);
    
    // Return the created subject
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error.message);
    res.status(500);
    throw new Error(`Failed to create subject: ${error.message}`);
  }
});

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
  try {
    console.log('getSubjects endpoint called');
    
    let subjects = [];
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // If superadmin, can see all subjects or filter by school
    if (req.user.role === 'superadmin') {
      // Check if a specific school filter is requested
      const schoolFilter = req.query.schoolId;
      
      if (schoolFilter) {
        console.log(`Superadmin filtering subjects by school ID: ${schoolFilter}`);
        subjects = await Subject.find({ schoolId: schoolFilter })
          .populate('teachers', 'name email')
          .populate('directions', 'name');
      } else {
        console.log('Superadmin fetching all subjects');
        subjects = await Subject.find({})
          .populate('teachers', 'name email')
          .populate('directions', 'name');
      }
    }
    // For school-specific users (admins, teachers, students)
    else if (schoolId) {
      console.log(`Fetching subjects for school ID: ${schoolId}`);
      
      // Filter subjects by schoolId
      subjects = await Subject.find({ schoolId: schoolId })
        .populate('teachers', 'name email')
        .populate('directions', 'name');
    } else {
      res.status(400);
      throw new Error('No school ID available');
    }
    
    console.log(`Retrieved ${subjects.length} subjects`);
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch subjects: ${error.message}`);
  }
});

// @desc    Get a specific subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find the subject with proper schoolId filtering
    const subject = await Subject.findOne(query)
      .populate('teachers', 'name email')
      .populate('directions', 'name');
      
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    
    res.status(200).json(subject);
  } catch (error) {
    console.error('Error fetching subject by ID:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch subject: ${error.message}`);
  }
});

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find the subject with proper schoolId filtering
    const subject = await Subject.findOne(query);
    
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    
    // Update the subject fields
    if (req.body.name) subject.name = req.body.name;
    if (req.body.description !== undefined) subject.description = req.body.description;
    if (req.body.teachers) subject.teachers = req.body.teachers;
    if (req.body.directions) subject.directions = req.body.directions;
    
    // Save the updated subject
    const updatedSubject = await subject.save();
    
    // Return the updated subject
    res.status(200).json(updatedSubject);
  } catch (error) {
    console.error('Error updating subject:', error.message);
    res.status(500);
    throw new Error(`Failed to update subject: ${error.message}`);
  }
});

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find and delete the subject with proper schoolId filtering
    const subject = await Subject.findOneAndDelete(query);
    
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    
    // Return success message
    res.status(200).json({ message: 'Subject removed successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error.message);
    res.status(500);
    throw new Error(`Failed to delete subject: ${error.message}`);
  }
});

// @desc    Get subjects by direction
// @route   GET /api/subjects/direction/:directionId
// @access  Public
const getSubjectsByDirection = asyncHandler(async (req, res) => {
  try {
    const { directionId } = req.params;
    console.log(`getSubjectsByDirection called for direction: ${directionId}`);
    
    if (!directionId) {
      res.status(400);
      throw new Error('Direction ID is required');
    }
    
    // Extract schoolId for filtering
    const schoolId = req.user?.schoolId || (req.school && req.school._id);
    
    // Filter query by direction and school
    const query = { directions: directionId };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const subjects = await Subject.find(query)
      .populate('teachers', 'name email')
      .populate('directions', 'name');
    
    console.log(`Found ${subjects.length} subjects for direction ${directionId}`);
    res.json(subjects);
  } catch (error) {
    console.error(`Error getting subjects by direction: ${error.message}`);
    res.status(500);
    throw new Error(`Failed to get subjects by direction: ${error.message}`);
  }
});

// @desc    Get subjects taught by current teacher
// @route   GET /api/subjects/teacher
// @access  Private/Teacher
const getSubjectsByTeacher = asyncHandler(async (req, res) => {
  try {
    const teacherId = req.user._id;
    console.log(`getSubjectsByTeacher called for teacher: ${teacherId}`);
    
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Filter query by teacher and school
    const query = { teachers: teacherId };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const subjects = await Subject.find(query)
      .populate('teachers', 'name email')
      .populate('directions', 'name');
    
    console.log(`Found ${subjects.length} subjects for teacher ${teacherId}`);
    res.json(subjects);
  } catch (error) {
    console.error(`Error getting subjects by teacher: ${error.message}`);
    res.status(500);
    throw new Error(`Failed to get subjects by teacher: ${error.message}`);
  }
});

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByDirection,
  getSubjectsByTeacher
};
