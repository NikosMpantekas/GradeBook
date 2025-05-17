const mongoose = require('mongoose');
const { connectMainDB } = require('./multiDbManager');

/**
 * Initialize database connections
 * This now just connects to the main admin DB
 * Tenant DBs will be connected on-demand
 */
const connectDB = async () => {
  try {
    // Connect to the main database for tenant/superadmin management
    await connectMainDB();
    
    // Also set up default mongoose connection for backward compatibility
    // This ensures existing code continues to work while we transition
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Default MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
