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
    let directions = [];
    
    // URGENT FIX: Check for BOTH user's token-decoded schoolId AND user-attached schoolConnection
    // This check has been made MORE AGGRESSIVE to ensure it catches ALL school users
    let isSchoolUser = req.user?.schoolId || req.user?.schoolConnection || req.school || 
                      (req.user?.email && req.user.email.includes('@'));
    
    // Extra check - if token has schoolId, user is DEFINITELY a school user
    if (req.user && req.headers?.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.schoolId) {
          console.log(`CRITICAL: Token contains schoolId ${decoded.schoolId} - User is DEFINITELY a school user`);
          isSchoolUser = true;
        }
      } catch (err) {
        // Just log the error but continue
        console.error('Error checking token for schoolId:', err.message);
      }
    }
    
    console.log(`User type determination: ${isSchoolUser ? 'SCHOOL USER' : 'SUPERADMIN'} (${req.user?.role || 'unknown role'})`);
    
    if (isSchoolUser) {
      // CRITICAL FIX: Handle both cases - when school info is in req.school or req.user.schoolDetails
      const school = req.school || req.user?.schoolDetails;
      
      // Determine school details from multiple sources
      let schoolName = 'Unknown school';
      let schoolId = 'Unknown ID';
      let emailDomain = null;
      
      if (school) {
        schoolName = school.name || schoolName;
        schoolId = school._id || schoolId;
        emailDomain = school.emailDomain;
      }
      
      // If we have user email but no email domain yet, extract it
      if (!emailDomain && req.user?.email && req.user.email.includes('@')) {
        emailDomain = req.user.email.split('@')[1];
        console.log(`Extracted email domain from user email: ${emailDomain}`);
      }
      
      console.log(`URGENT FIX: Fetching directions for school: ${schoolName} (ID: ${schoolId})`);
      console.log(`User: ${req.user ? req.user.name : 'unknown'}, Role: ${req.user ? req.user.role : 'unknown'}`);
      
      // CRITICAL FIX: School connection determination logic completely rewritten
      let connection;
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      
      // Try multiple sources for school connection, in order of preference
      if (req.user?.schoolConnection && req.user.schoolConnection.readyState === 1) {
        // 1. User object's schoolConnection (from auth middleware)
        console.log('URGENT FIX: Using schoolConnection from user object');
        connection = req.user.schoolConnection;
      } 
      else if (req.schoolConnection && req.schoolConnection.readyState === 1) {
        // 2. Request object's schoolConnection (from middleware)
        console.log('Using existing school connection from middleware');
        connection = req.schoolConnection;
      }
      else {
        // 3. Create a fresh connection using available school information
        console.log('No existing connection found - creating new school connection');
        
        // First try with school object
        if (school) {
          console.log(`Creating connection using school object: ${schoolName}`);
          const result = await connectToSchoolDb(school);
          connection = result.connection;
        }
        // Then try with just the email domain if available
        else if (emailDomain) {
          console.log(`Creating connection using email domain: ${emailDomain}`);
          // Find school by email domain
          const School = mongoose.model('School');
          const foundSchool = await School.findOne({ emailDomain });
          
          if (foundSchool) {
            console.log(`Found school by email domain: ${foundSchool.name}`);
            const result = await connectToSchoolDb(foundSchool);
            connection = result.connection;
          } else {
            console.error(`No school found for email domain: ${emailDomain}`);
          }
        }
        // Last resort - if user has schoolId but no connection yet
        else if (req.user?.schoolId) {
          console.log(`Creating connection using schoolId: ${req.user.schoolId}`);
          const School = mongoose.model('School');
          const foundSchool = await School.findById(req.user.schoolId);
          
          if (foundSchool) {
            console.log(`Found school by ID: ${foundSchool.name}`);
            const result = await connectToSchoolDb(foundSchool);
            connection = result.connection;
          } else {
            console.error(`No school found for ID: ${req.user.schoolId}`);
          }
        }
      }
      
      // CRITICAL: Validate the connection
      if (!connection) {
        console.error('CRITICAL ERROR: Failed to establish database connection for school user');
        res.status(500);
        throw new Error('Failed to connect to school database');
      }
      
      // Verify we're connected to the right database if we have domain info
      if (connection.db && emailDomain) {
        const expectedDbName = emailDomain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
        const actualDbName = connection.db.databaseName;
        
        console.log(`Database connection check - Expected: ${expectedDbName}, Actual: ${actualDbName}`);
        
        if (actualDbName !== expectedDbName) {
          console.error(`CRITICAL ERROR: Connected to wrong database (${actualDbName} instead of ${expectedDbName})`);
          // Create a new connection with the right database
          const School = mongoose.model('School');
          const foundSchool = await School.findOne({ emailDomain });
          
          if (foundSchool) {
            console.log(`Found school by email domain: ${foundSchool.name}`);
            const result = await connectToSchoolDb(foundSchool);
            connection = result.connection;
            console.log(`New connection established to: ${connection.db?.databaseName || 'unknown'}`);
          }
        }
      }
      
      // CRITICAL: Get the Direction model
      let SchoolDirection;
      
      try {
        // Try to get the existing model first
        if (connection.models && connection.models.Direction) {
          SchoolDirection = connection.models.Direction;
          console.log('Found existing Direction model in connection');
        } else {
          // Create a new model with proper schema
          console.log('Creating new Direction model in school database');
          const directionSchema = new mongoose.Schema({
            name: { type: String, required: true },
            description: { type: String },
          }, { timestamps: true });
          
          SchoolDirection = connection.model('Direction', directionSchema);
        }
        
        // Get all collections for debugging
        const collections = await connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log(`Database has ${collections.length} collections: ${collectionNames.join(', ')}`);
        
        // Count directions first for verification
        const directionCount = await SchoolDirection.countDocuments({});
        console.log(`VERIFICATION: Direction count in database: ${directionCount}`);
        
        // Query for directions
        directions = await SchoolDirection.find({}).sort({ name: 1 });
        console.log(`CRITICAL FIX: Found ${directions.length} directions in SCHOOL database`);
        
        // Log details of found directions
        if (directions.length > 0) {
          directions.forEach(direction => {
            console.log(`- SCHOOL Direction: ${direction.name} (ID: ${direction._id})`);
          });
        } else {
          // Check if directions collection exists
          if (!collectionNames.includes('directions')) {
            console.log('Note: directions collection does not exist yet in this database');
          }
        }
      } catch (error) {
        console.error(`CRITICAL ERROR accessing directions in school database: ${error.message}`);
        res.status(500);
        throw new Error(`Failed to access directions: ${error.message}`);
      }
    } else {
      // This is definitely a superadmin request
      console.log('Superadmin user - fetching directions from main database');
      directions = await Direction.find({}).sort({ name: 1 });
      console.log(`Found ${directions.length} directions in main database`);
    }
    
    // Return the directions
    console.log(`Returning ${directions.length} directions to client`);
    res.status(200).json(directions);
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
