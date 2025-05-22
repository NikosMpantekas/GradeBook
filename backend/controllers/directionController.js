const asyncHandler = require('express-async-handler');
const Direction = require('../models/directionModel');

// @desc    Create a new direction
// @route   POST /api/directions
// @access  Private/Admin
const createDirection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error('Please provide name and description');
  }

  try {
    let direction;
    
    // CRITICAL FIX: Check if this is a request from a school-specific user
    if (req.school) {
      console.log(`Creating direction in school database: ${req.school.name}`);
      
      // Connect to the school-specific database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(req.school);
      
      // Get or create the Direction model for this school
      let SchoolDirection;
      try {
        SchoolDirection = connection.model('Direction');
      } catch (modelError) {
        // If model doesn't exist, create it
        console.log('Creating Direction model in school database');
        const directionSchema = new connection.Schema({
          name: String,
          description: String,
        }, { timestamps: true });
        
        SchoolDirection = connection.model('Direction', directionSchema);
      }
      
      // Check if direction already exists in school database
      const directionExists = await SchoolDirection.findOne({ name });
      if (directionExists) {
        res.status(400);
        throw new Error('Direction already exists in this school');
      }
      
      // Create the direction in the school-specific database
      direction = await SchoolDirection.create({
        name,
        description,
      });
      
      console.log(`Created direction in school database: ${direction.name} (${direction._id})`);
    } else {
      // This is a superadmin request - save to main database
      console.log('Creating direction in main database');
      
      // Check if direction already exists in main database
      const directionExists = await Direction.findOne({ name });
      if (directionExists) {
        res.status(400);
        throw new Error('Direction already exists');
      }
      
      // Create in main database
      direction = await Direction.create({
        name,
        description,
      });
      
      console.log(`Created direction in main database: ${direction.name} (${direction._id})`);
    }
    
    if (direction) {
      res.status(201).json(direction);
    } else {
      res.status(400);
      throw new Error('Invalid direction data');
    }
  } catch (error) {
    console.error('Error creating direction:', error.message);
    res.status(500);
    throw new Error('Failed to create direction: ' + error.message);
  }
});

// @desc    Get all directions
// @route   GET /api/directions
// @access  Public
const getDirections = asyncHandler(async (req, res) => {
  console.log('getDirections endpoint called');
  
  try {
    let directions = [];
    
    // Check if this is a request from a school-specific user
    if (req.school) {
      console.log(`Fetching directions for school: ${req.school.name}`);
      // Connect to the school-specific database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const schoolConnection = await connectToSchoolDb(req.school);
      
      // Check if Direction model exists in this school's database
      try {
        const SchoolDirection = schoolConnection.model('Direction');
        directions = await SchoolDirection.find({});
        console.log(`Found ${directions.length} directions in school database`);
      } catch (modelError) {
        // If model doesn't exist, create a basic one
        console.log('Direction model not found in school database, using default model');
        const directionSchema = new schoolConnection.Schema({
          name: String,
          description: String,
        }, { timestamps: true });
        
        const SchoolDirection = schoolConnection.model('Direction', directionSchema);
        directions = await SchoolDirection.find({});
      }
    } else {
      // This is a superadmin or legacy request
      console.log('Fetching directions from main database');
      directions = await Direction.find({}).sort({ name: 1 });
      
      // Enhanced logging for debugging
      console.log(`Found ${directions.length} directions in main database:`);
      directions.forEach(direction => {
        console.log(`- Direction: ${direction.name} (ID: ${direction._id})`);
      });
    }
    
    console.log('Returning directions to client');
    res.status(200).json(directions);
  } catch (error) {
    console.error('Error fetching directions:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get direction by ID
// @route   GET /api/directions/:id
// @access  Public
const getDirectionById = asyncHandler(async (req, res) => {
  const direction = await Direction.findById(req.params.id);

  if (direction) {
    res.json(direction);
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

// @desc    Update direction
// @route   PUT /api/directions/:id
// @access  Private/Admin
const updateDirection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const direction = await Direction.findById(req.params.id);

  if (direction) {
    direction.name = name || direction.name;
    direction.description = description || direction.description;

    const updatedDirection = await direction.save();
    res.json(updatedDirection);
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

// @desc    Delete direction
// @route   DELETE /api/directions/:id
// @access  Private/Admin
const deleteDirection = asyncHandler(async (req, res) => {
  const direction = await Direction.findById(req.params.id);

  if (direction) {
    await direction.deleteOne();
    res.json({ message: 'Direction removed' });
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

module.exports = {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
};
