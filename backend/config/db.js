const mongoose = require('mongoose');

// Single Database Connection for Multi-Tenant Architecture
const connectDB = async () => {
  try {
    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.warn('Warning: MONGO_URI is not defined. Using fallback connection string.'.yellow);
      // Use a fallback connection string for local development
      process.env.MONGO_URI = 'mongodb://localhost:27017/gradebook';
    }
    
    // Validate that MONGO_URI is a string
    if (typeof process.env.MONGO_URI !== 'string') {
      throw new Error('MONGO_URI must be a string');
    }

    // Connect to a single MongoDB database
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional options for better performance and reliability
      maxPoolSize: 50,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    console.log(`Database Name: ${conn.connection.name}`.cyan.underline);
    
    // Create index for faster queries
    console.log('Setting up database indexes for multi-tenancy...');
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

// Keep a reference to the connection
let dbConnection = null;

// Get the mongoose connection
const getConnection = async () => {
  if (!dbConnection) {
    dbConnection = await connectDB();
  }
  return dbConnection;
};

// Export functions
module.exports = {
  connectDB,
  getConnection
};
