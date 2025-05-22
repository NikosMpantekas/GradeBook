const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');

// @desc    Create a new school
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = asyncHandler(async (req, res) => {
  const { name, address, phone, email, website, logo } = req.body;

  if (!name || !address) {
    res.status(400);
    throw new Error('Please provide name and address');
  }

  // Check if school already exists
  const schoolExists = await School.findOne({ name });

  if (schoolExists) {
    res.status(400);
    throw new Error('School already exists');
  }

  const school = await School.create({
    name,
    address,
    phone,
    email,
    website,
    logo,
  });

  if (school) {
    res.status(201).json(school);
  } else {
    res.status(400);
    throw new Error('Invalid school data');
  }
});

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
const getSchools = asyncHandler(async (req, res) => {
  console.log('getSchools endpoint called');
  
  try {
    let schools = [];
    
    // Check if this is a request from a superadmin
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all schools from the main database
      console.log('Fetching all schools for superadmin');
      // Include school clusters for superadmin view
      schools = await School.find({});
    } 
    // Check if this is a school-specific user
    else if (req.school) {
      // CRITICAL FIX: For school-specific users, don't include the school cluster itself
      // Instead, we want to find schools created within this school cluster's database
      console.log(`Fetching schools within cluster: ${req.school.name}`);
      
      try {
        // IMPROVED: Use existing connection from middleware if available
        let connection;
        if (req.schoolConnection) {
          console.log('Using existing school connection from middleware');
          connection = req.schoolConnection;
        } else {
          // Fallback to creating a new connection
          console.log('Creating new school connection');
          const { connectToSchoolDb } = require('../config/multiDbConnect');
          const result = await connectToSchoolDb(req.school);
          connection = result.connection;
        }
        
        if (!connection) {
          throw new Error('Failed to get valid database connection');
        }
        
        // ENHANCED LOGGING: Examine connection state
        console.log(`Database connection state: ${connection.readyState}`);
        console.log(`Connected to database: ${connection.db ? connection.db.databaseName : 'unknown'}`);
        
        // List all collections to verify database contents
        const collections = await connection.db.listCollections().toArray();
        console.log(`Database has ${collections.length} collections:`, 
          collections.map(c => c.name).join(', '));
        
        // Check if School model exists in this school's database
        try {
          const SchoolModel = connection.model('School');
          const schoolsInCluster = await SchoolModel.find({}).sort({ name: 1 });
          
          console.log(`Found ${schoolsInCluster.length} schools in cluster database`);
          if (schoolsInCluster.length > 0) {
            schoolsInCluster.forEach(school => {
              console.log(`- Cluster School: ${school.name} (ID: ${school._id})`);
            });
          }
          schools = schoolsInCluster;
        } catch (modelError) {
          // If model doesn't exist, create it
          console.log('School model not found in cluster database, creating model:', modelError.message);
          
          // Create the School model in this database
          const schoolSchema = new connection.Schema({
            name: String,
            address: String,
            phone: String,
            email: String,
            website: String,
            logo: String,
            active: { type: Boolean, default: true },
          }, { timestamps: true });
          
          const SchoolModel = connection.model('School', schoolSchema);
          schools = await SchoolModel.find({}).sort({ name: 1 });
          console.log(`Found ${schools.length} schools after creating model`);
        }
      } catch (dbError) {
        console.error('Error connecting to school cluster database:', dbError.message);
        // CRITICAL FIX: For debugging - include stack trace
        console.error('Stack trace:', dbError.stack);
        schools = [];
      }
    } 
    // Fallback to main database for backward compatibility, but EXCLUDE school clusters
    else {
      console.log('Fetching regular schools from main database (excluding clusters)');
      
      // CRITICAL FIX: Only return regular schools, not school clusters
      // School clusters have emailDomain set
      schools = await School.find({ 
        $or: [
          { emailDomain: { $exists: false } },
          { emailDomain: '' }
        ]
      }).sort({ name: 1 });
      
      console.log(`Found ${schools.length} regular schools in main database:`);
      schools.forEach(school => {
        console.log(`- School: ${school.name} (ID: ${school._id})`);
      });
    }
    
    console.log('Returning schools to client');
    res.status(200).json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get school by ID
// @route   GET /api/schools/:id
// @access  Public
const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    res.json(school);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private/Admin
const updateSchool = asyncHandler(async (req, res) => {
  const { name, address, phone, email, website, logo } = req.body;

  const school = await School.findById(req.params.id);

  if (school) {
    school.name = name || school.name;
    school.address = address || school.address;
    school.phone = phone || school.phone;
    school.email = email || school.email;
    school.website = website || school.website;
    school.logo = logo || school.logo;

    const updatedSchool = await school.save();
    res.json(updatedSchool);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    await school.deleteOne();
    res.json({ message: 'School removed' });
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

module.exports = {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
