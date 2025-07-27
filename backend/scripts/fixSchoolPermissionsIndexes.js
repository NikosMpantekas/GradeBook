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

const fixSchoolPermissionsIndexes = async () => {
  try {
    console.log('🔧 Starting school permissions index fix...');
    
    // Connect to database
    await connectDB();
    
    const collection = mongoose.connection.db.collection('schoolpermissions');
    
    // STEP 1: List all current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (name: ${index.name})`);
    });
    
    // STEP 2: Drop the problematic school_id index if it exists
    try {
      console.log('🗑️ Attempting to drop school_id_1 index...');
      await collection.dropIndex('school_id_1');
      console.log('✅ Successfully dropped school_id_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ school_id_1 index does not exist (already dropped)');
      } else {
        console.error('❌ Error dropping school_id_1 index:', error.message);
      }
    }
    
    // STEP 3: Remove all records with null schoolId values
    console.log('🧹 Cleaning up records with null schoolId values...');
    
    // Remove records with null school_id
    const deleteResult1 = await collection.deleteMany({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } }
      ]
    });
    console.log(`✅ Deleted ${deleteResult1.deletedCount} records with null school_id`);
    
    // Remove records with null schoolId
    const deleteResult2 = await collection.deleteMany({
      $or: [
        { schoolId: null },
        { schoolId: undefined },
        { schoolId: { $exists: false } }
      ]
    });
    console.log(`✅ Deleted ${deleteResult2.deletedCount} records with null schoolId`);
    
    // STEP 4: Ensure the correct schoolId index exists
    try {
      console.log('📍 Creating schoolId index...');
      await collection.createIndex({ schoolId: 1 }, { unique: true });
      console.log('✅ Successfully created schoolId index');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ schoolId index already exists');
      } else {
        console.error('❌ Error creating schoolId index:', error.message);
      }
    }
    
    // STEP 5: Verify final state
    console.log('🔍 Final index state:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (name: ${index.name})`);
    });
    
    // Count final records
    const totalRecords = await collection.countDocuments();
    const nullRecords = await collection.countDocuments({
      $or: [
        { school_id: null },
        { school_id: undefined },
        { school_id: { $exists: false } },
        { schoolId: null },
        { schoolId: undefined },
        { schoolId: { $exists: false } }
      ]
    });
    
    console.log(`🎉 Index fix completed!`);
    console.log(`Total records: ${totalRecords}`);
    console.log(`Records with null IDs: ${nullRecords}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Index fix failed:', error);
    process.exit(1);
  }
};

// Run fix
fixSchoolPermissionsIndexes();
