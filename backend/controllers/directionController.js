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
    
    // CRITICAL FIX: Check for both req.school and req.user?.schoolConnection
    // This ensures we can access school-specific data even when using a school connection
    // that was attached to the user object during authentication
    if (req.school || (req.user && req.user.schoolConnection)) {
      // CRITICAL FIX: Handle both cases - when school info is in req.school or req.user.schoolDetails
      const school = req.school || req.user?.schoolDetails;
      const schoolName = school?.name || 'Unknown school';
      const schoolId = school?._id || 'Unknown ID';
      
      console.log(`Fetching directions for school: ${schoolName} (ID: ${schoolId})`);
      
      // CRITICAL FIX: Log user role and email domain for debugging
      console.log(`User: ${req.user ? req.user.name : 'unknown'}, Role: ${req.user ? req.user.role : 'unknown'}`);
      if (req.user && req.user.email) {
        const emailDomain = req.user.email.split('@')[1];
        console.log(`User email domain: ${emailDomain}`);
      }
      
      try {
        // CRITICAL FIX: Always ensure we're using the correct database connection
        // Prioritize the user's schoolConnection over req.schoolConnection
        let connection;
        const { connectToSchoolDb } = require('../config/multiDbConnect');
        
        // ENHANCED: Improved connection logic for consistent database access
        // First check for user.schoolConnection (from auth middleware)
        if (req.user && req.user.schoolConnection && req.user.schoolConnection.readyState === 1) {
          console.log('CRITICAL FIX: Using schoolConnection from user object');
          connection = req.user.schoolConnection;
          
          if (connection.db) {
            console.log(`Connected to database via user object: ${connection.db.databaseName}`);
          }
        }
        // Then check for req.schoolConnection (from middleware)
        else if (req.schoolConnection && req.schoolConnection.readyState === 1) {
          console.log('Using existing school connection from middleware');
          connection = req.schoolConnection;
          
          // Verify that the connection is to the correct database
          if (connection.db) {
            console.log(`Connected to database: ${connection.db.databaseName}`);
            
            // CRITICAL FIX: If email domain exists, check if connected to the right database
            const schoolToUse = req.school || req.user?.schoolDetails;
            if (schoolToUse?.emailDomain) {
              const domainParts = schoolToUse.emailDomain.split('.');
              const expectedDbName = domainParts[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
              
              if (connection.db.databaseName !== expectedDbName) {
                console.log(`WARNING: Connected to wrong database! Expected ${expectedDbName}, got ${connection.db.databaseName}`);
                console.log('Creating new connection to correct database...');
                const result = await connectToSchoolDb(schoolToUse);
                connection = result.connection;
              }
            }
          }
        } else {
          // Create a new connection
          console.log('Creating new school connection');
          const schoolToUse = req.school || req.user?.schoolDetails;
          if (schoolToUse) {
            const result = await connectToSchoolDb(schoolToUse);
            connection = result.connection;
          } else {
            console.error('CRITICAL ERROR: No school information available to establish connection');
            throw new Error('No school information available');
          }
        }
        
        if (!connection) {
          throw new Error('Failed to get valid database connection');
        }
        
        // ENHANCED: Check if Direction model exists in school database with better error handling
        let SchoolDirection;
        
        try {
          // Try to get the existing model first
          if (connection.models && connection.models.Direction) {
            SchoolDirection = connection.models.Direction;
            console.log('Found existing Direction model');
          } else {
            // Create a new model using the standard schema
            console.log('Creating new Direction model');
            const { DirectionSchema } = require('../config/schoolModelRegistration');
            SchoolDirection = connection.model('Direction', DirectionSchema);
          }
          
          // CRITICAL FIX: Verify collections in database to ensure Direction collection exists
          const collections = await connection.db.listCollections().toArray();
          const collectionNames = collections.map(c => c.name);
          console.log(`Database has ${collections.length} collections: ${collectionNames.join(', ')}`);
          
          // If directions collection doesn't exist yet, it will be created on first query
          if (!collectionNames.includes('directions')) {
            console.log('Warning: directions collection does not exist yet - will be created on first insert');
          }
          
          // CRITICAL FIX: Query for directions with detailed logging
          console.log(`Executing query against: ${connection.db ? connection.db.databaseName : 'unknown'} database`);
          console.log(`Collection name: ${SchoolDirection.collection.name}`);
          
          // Get count of directions before querying them
          const directionCount = await SchoolDirection.countDocuments({});
          console.log(`Direction count in database: ${directionCount}`);
          
          // Query for directions
          directions = await SchoolDirection.find({}).sort({ name: 1 });
          console.log(`Found ${directions.length} directions in school database`);
          
          // Log direction details for debugging
          if (directions.length > 0) {
            directions.forEach(direction => {
              console.log(`- School DB Direction: ${direction.name} (ID: ${direction._id})`);
            });
          } else {
            console.log('No directions found in school database - this might indicate a problem with the database or collection');
          }
        } catch (modelError) {
          console.error('Error with Direction model:', modelError.message);
          
          // Try creating a basic model as fallback
          try {
            console.log('Attempting to create basic Direction model');
            const directionSchema = new connection.Schema({
              name: String,
              description: String,
            }, { timestamps: true });
            
            SchoolDirection = connection.model('Direction', directionSchema);
            directions = await SchoolDirection.find({});
            console.log(`Found ${directions.length} directions after creating basic model`);
          } catch (fallbackError) {
            console.error('Fallback model creation failed:', fallbackError.message);
            throw fallbackError; // Re-throw to trigger the fallback to main database
          }
        }
      } catch (error) {
        console.error('Error accessing school database:', error.message);
        // Fall back to checking the main database
        console.log('Falling back to main database for directions');
        directions = await Direction.find({}).sort({ name: 1 });
        console.log(`Found ${directions.length} directions in main database`);
      }
    } else {
      // This is a superadmin or legacy request
      console.log('Fetching directions from main database');
      directions = await Direction.find({}).sort({ name: 1 });
      
      // Enhanced logging for debugging
      console.log(`Found ${directions.length} directions in main database:`);
      if (directions.length > 0) {
        directions.forEach(direction => {
          console.log(`- Direction: ${direction.name} (ID: ${direction._id})`);
        });
      }
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
