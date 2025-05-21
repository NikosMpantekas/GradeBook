const mongoose = require('mongoose');

// This utility registers all required schemas in a school-specific database connection
const registerSchemaModels = (connection) => {
  if (!connection) {
    console.error('Invalid connection provided to registerSchemaModels');
    return;
  }

  console.log('Registering schema models for school database connection...');
  
  try {
    // Step 1: Create the schemas first, then register the models in the correct order
    // to avoid reference issues
    
    // Create School schema
    const schoolSchema = new mongoose.Schema({
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String },
      email: { type: String },
      website: { type: String },
      logo: { type: String },
      dbConfig: {
        uri: { type: String, default: '' },
        dbName: { type: String, default: '' }
      }
    }, {
      timestamps: true
    });
    
    // Create Direction schema
    const directionSchema = new mongoose.Schema({
      name: { type: String, required: true },
      description: { type: String },
      school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
    }, {
      timestamps: true
    });
    
    // Create Subject schema
    const subjectSchema = new mongoose.Schema({
      name: { type: String, required: true },
      description: { type: String },
      school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
      direction: { type: mongoose.Schema.Types.ObjectId, ref: 'Direction' },
      color: { type: String, default: '#3f51b5' }
    }, {
      timestamps: true
    });
    
    // Create Notification schema
    const notificationSchema = new mongoose.Schema({
      title: { type: String, required: true },
      message: { type: String, required: true },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      schools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],
      directions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Direction' }],
      subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
      sendToAll: { type: Boolean, default: false },
      school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
      direction: { type: mongoose.Schema.Types.ObjectId, ref: 'Direction' },
      subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
      read: { type: Boolean, default: false },
      important: { type: Boolean, default: false }
    }, {
      timestamps: true
    });
    
    // Step 2: Register models in correct dependency order
    
    // 1. Register School model (no dependencies)
    if (!connection.models['School']) {
      connection.model('School', schoolSchema);
      console.log('✅ School model registered');
    }
    
    // 2. Register Direction model (depends on School)
    if (!connection.models['Direction']) {
      connection.model('Direction', directionSchema);
      console.log('✅ Direction model registered');
    }
    
    // 3. Register Subject model (depends on School and Direction)
    if (!connection.models['Subject']) {
      connection.model('Subject', subjectSchema);
      console.log('✅ Subject model registered');
    }
    
    // 4. Register Notification model (depends on User, School, Direction, Subject)
    if (!connection.models['Notification']) {
      connection.model('Notification', notificationSchema);
      console.log('✅ Notification model registered');
    }
    
    console.log('Schema models registration complete ✅');
  } catch (error) {
    console.error('Error registering schema models:', error);
  }
};

module.exports = registerSchemaModels;
