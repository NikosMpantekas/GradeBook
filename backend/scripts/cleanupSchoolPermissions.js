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
    
    // CRITICAL: Check both possible field names (school_id and schoolId)
    console.log('🔍 Checking for records with null/invalid school_id...');
    const invalidRecords1 = await mongoose.connection.db.collection('schoolpermissions').find({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } }
      ]
    }).toArray();
    
    console.log('🔍 Checking for records with null/invalid schoolId...');
    const invalidRecords2 = await mongoose.connection.db.collection('schoolpermissions').find({
      $or: [
        { schoolId: null },
        { schoolId: undefined },
        { schoolId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${invalidRecords1.length} invalid records with null/undefined school_id`);
    console.log(`Found ${invalidRecords2.length} invalid records with null/undefined schoolId`);
    
    // Delete records with null school_id
    if (invalidRecords1.length > 0) {
      const deleteResult1 = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
        $or: [
          { school_id: null },
          { school_id: undefined },
          { school_id: { $exists: false } }
        ]
      });
      console.log(`✅ Deleted ${deleteResult1.deletedCount} invalid records with school_id`);
    }
    
    // Delete records with null schoolId
    if (invalidRecords2.length > 0) {
      const deleteResult2 = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
        $or: [
          { schoolId: null },
          { schoolId: undefined },
          { schoolId: { $exists: false } }
        ]
      });
      console.log(`✅ Deleted ${deleteResult2.deletedCount} invalid records with schoolId`);
    }
    
    // Check for duplicates by school_id
    console.log('🔍 Checking for duplicates by school_id...');
    const duplicates1 = await mongoose.connection.db.collection('schoolpermissions').aggregate([
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
    
    // Check for duplicates by schoolId
    console.log('🔍 Checking for duplicates by schoolId...');
    const duplicates2 = await mongoose.connection.db.collection('schoolpermissions').aggregate([
      {
        $group: {
          _id: "$schoolId",
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
    
    console.log(`Found ${duplicates1.length} groups of duplicate records by school_id`);
    console.log(`Found ${duplicates2.length} groups of duplicate records by schoolId`);
    
    // Clean up duplicates by school_id
    for (const duplicate of duplicates1) {
      const [keepId, ...deleteIds] = duplicate.docs;
      if (deleteIds.length > 0) {
        const deleteResult = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
          _id: { $in: deleteIds }
        });
        console.log(`Deleted ${deleteResult.deletedCount} duplicate records for school_id: ${duplicate._id}`);
      }
    }
    
    // Clean up duplicates by schoolId
    for (const duplicate of duplicates2) {
      const [keepId, ...deleteIds] = duplicate.docs;
      if (deleteIds.length > 0) {
        const deleteResult = await mongoose.connection.db.collection('schoolpermissions').deleteMany({
          _id: { $in: deleteIds }
        });
        console.log(`Deleted ${deleteResult.deletedCount} duplicate records for schoolId: ${duplicate._id}`);
      }
    }
    
    // Final verification
    const remainingRecords = await mongoose.connection.db.collection('schoolpermissions').countDocuments();
    const nullRecords1 = await mongoose.connection.db.collection('schoolpermissions').countDocuments({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } }
      ]
    });
    const nullRecords2 = await mongoose.connection.db.collection('schoolpermissions').countDocuments({
      $or: [
        { schoolId: null },
        { schoolId: undefined },
        { schoolId: { $exists: false } }
      ]
    });
    
    console.log(`🎉 Cleanup completed!`);
    console.log(`Total remaining records: ${remainingRecords}`);
    console.log(`Records with null school_id: ${nullRecords1}`);
    console.log(`Records with null schoolId: ${nullRecords2}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupSchoolPermissions();
