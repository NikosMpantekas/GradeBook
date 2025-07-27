const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const cleanupSchoolPermissions = async () => {
  try {
    console.log('🧹 Starting school permissions cleanup...');
    
    // Connect to database
    await connectDB();
    
    // Find all records with null or invalid schoolId
    const invalidRecords = await mongoose.connection.db.collection('schoolpermissions').find({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${invalidRecords.length} invalid records with null/undefined school_id`);
    
    if (invalidRecords.length > 0) {
      // Delete invalid records
      const deleteResult = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
        $or: [
          { school_id: null },
          { school_id: undefined },
          { school_id: { $exists: false } }
        ]
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} invalid records`);
    }
    
    // Check for duplicates by schoolId
    const duplicates = await mongoose.connection.db.collection('schoolpermissions').aggregate([
      {
        $group: {
          _id: "$school_id",
          count: { $sum: 1 },
          docs: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} groups of duplicate records`);
    
    // Clean up duplicates - keep the first one, delete the rest
    for (const duplicate of duplicates) {
      const [keepId, ...deleteIds] = duplicate.docs;
      
      if (deleteIds.length > 0) {
        const deleteResult = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
          _id: { $in: deleteIds }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} duplicate records for school_id: ${duplicate._id}`);
      }
    }
    
    // Verify cleanup
    const remainingRecords = await mongoose.connection.db.collection('schoolpermissions').countDocuments();
    const nullRecords = await mongoose.connection.db.collection('schoolpermissions').countDocuments({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } }
      ]
    });
    
    console.log(`🎉 Cleanup completed!`);
    console.log(`Total remaining records: ${remainingRecords}`);
    console.log(`Records with null school_id: ${nullRecords}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupSchoolPermissions();
