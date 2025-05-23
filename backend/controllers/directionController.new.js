const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Direction = require('../models/directionModel');

// @desc    Create a new direction
// @route   POST /api/directions
// @access  Private/Admin
const createDirection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a direction name');
  }

  try {
    // Extract schoolId from user or request
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    if (!schoolId && req.user.role !== 'superadmin') {
      res.status(400);
      throw new Error('School ID is required');
    }
    
    // Check if direction already exists in this school
    const existingDirection = await Direction.findOne({
      name: name,
      schoolId: schoolId
    });
    
    if (existingDirection) {
      res.status(400);
      throw new Error('Direction with this name already exists in this school');
    }
    
    // Create the direction with proper schoolId for multi-tenancy
    const directionData = {
      name,
      description: description || '',
      schoolId: schoolId
    };
    
    // For superadmin, they might create a general direction without schoolId
    if (req.user.role === 'superadmin' && !schoolId) {
      delete directionData.schoolId;
    }
    
    // Create the direction in the database
    const direction = await Direction.create(directionData);
    
    // Return the created direction
    res.status(201).json(direction);
  } catch (error) {
    console.error('Error creating direction:', error.message);
    res.status(500);
    throw new Error(`Failed to create direction: ${error.message}`);
  }
});

// @desc    Get all directions
// @route   GET /api/directions
// @access  Private
const getDirections = asyncHandler(async (req, res) => {
  try {
    console.log('getDirections endpoint called');
    
    let directions = [];
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // If superadmin, can see all directions or filter by school
    if (req.user.role === 'superadmin') {
      // Check if a specific school filter is requested
      const schoolFilter = req.query.schoolId;
      
      if (schoolFilter) {
        console.log(`Superadmin filtering directions by school ID: ${schoolFilter}`);
        directions = await Direction.find({ schoolId: schoolFilter });
      } else {
        console.log('Superadmin fetching all directions');
        directions = await Direction.find({});
      }
    }
    // For school-specific users (admins, teachers, students)
    else if (schoolId) {
      console.log(`Fetching directions for school ID: ${schoolId}`);
      
      // Filter directions by schoolId
      directions = await Direction.find({ schoolId: schoolId });
    } else {
      res.status(400);
      throw new Error('No school ID available');
    }
    
    console.log(`Retrieved ${directions.length} directions`);
    res.status(200).json(directions);
  } catch (error) {
    console.error('Error fetching directions:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch directions: ${error.message}`);
  }
});

// @desc    Get a specific direction
// @route   GET /api/directions/:id
// @access  Private
const getDirectionById = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find the direction with proper schoolId filtering
    const direction = await Direction.findOne(query);
      
    if (!direction) {
      res.status(404);
      throw new Error('Direction not found');
    }
    
    res.status(200).json(direction);
  } catch (error) {
    console.error('Error fetching direction by ID:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch direction: ${error.message}`);
  }
});

// @desc    Update a direction
// @route   PUT /api/directions/:id
// @access  Private/Admin
const updateDirection = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find the direction with proper schoolId filtering
    const direction = await Direction.findOne(query);
    
    if (!direction) {
      res.status(404);
      throw new Error('Direction not found');
    }
    
    // Update the direction fields
    if (req.body.name) direction.name = req.body.name;
    if (req.body.description !== undefined) direction.description = req.body.description;
    
    // Save the updated direction
    const updatedDirection = await direction.save();
    
    // Return the updated direction
    res.status(200).json(updatedDirection);
  } catch (error) {
    console.error('Error updating direction:', error.message);
    res.status(500);
    throw new Error(`Failed to update direction: ${error.message}`);
  }
});

// @desc    Delete a direction
// @route   DELETE /api/directions/:id
// @access  Private/Admin
const deleteDirection = asyncHandler(async (req, res) => {
  try {
    // Extract schoolId for filtering
    const schoolId = req.user.schoolId || (req.school && req.school._id);
    
    // Build the query - include schoolId for non-superadmin users
    const query = { _id: req.params.id };
    if (req.user.role !== 'superadmin') {
      query.schoolId = schoolId;
    }
    
    // Find and delete the direction with proper schoolId filtering
    const direction = await Direction.findOneAndDelete(query);
    
    if (!direction) {
      res.status(404);
      throw new Error('Direction not found');
    }
    
    // Return success message
    res.status(200).json({ message: 'Direction removed successfully' });
  } catch (error) {
    console.error('Error deleting direction:', error.message);
    res.status(500);
    throw new Error(`Failed to delete direction: ${error.message}`);
  }
});

module.exports = {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
};
