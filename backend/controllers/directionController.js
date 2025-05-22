const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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
    // ULTRA SIMPLIFIED APPROACH - This is a complete rewrite to avoid race conditions
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    let directions = [];
    let schoolFound = false;
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: If we found a school, try to connect to its database
    if (school) {
      try {
        // Connect to school database
        const { connectToSchoolDb } = require('../config/multiDbConnect');
        const { connection } = await connectToSchoolDb(school);
        
        if (!connection) {
          throw new Error('Failed to connect to school database');
        }
        
        console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
        
        // Check or create Direction model
        let DirectionModel;
        try {
          DirectionModel = connection.model('Direction');
        } catch (err) {
          // Model doesn't exist, create it
          const directionSchema = new mongoose.Schema({
            name: { type: String, required: true },
            description: { type: String },
          }, { timestamps: true });
          
          DirectionModel = connection.model('Direction', directionSchema);
        }
        
        // Fetch directions from school database
        directions = await DirectionModel.find({}).sort({ name: 1 });
        schoolFound = true;
        
        console.log(`Found ${directions.length} directions in school database: ${school.name}`);
        if (directions.length > 0) {
          directions.forEach(d => console.log(`- ${d.name}`));
        }
      } catch (err) {
        console.error('Error connecting to school database:', err.message);
      }
    } else {
      console.log('No school found for this user, assuming superadmin');
    }
    
    // STEP 4: If no school was found or connection failed, fall back to main database ONLY for superadmins
    if (!schoolFound && req.user && req.user.role === 'superadmin') {
      console.log('User is superadmin, using main database');
      directions = await Direction.find({}).sort({ name: 1 });
      console.log(`Found ${directions.length} directions in main database`);
    }
    
    // Return results
    console.log(`Returning ${directions.length} directions to client`);
    return res.status(200).json(directions);
    
  } catch (error) {
    console.error(`ERROR in getDirections: ${error.message}`);
    res.status(500);
    throw new Error(`Server error: ${error.message}`);
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
