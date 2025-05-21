const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// This utility registers all required schemas in a school-specific database connection
const registerSchemaModels = (connection) => {
  if (!connection || !connection.db) {
    console.error('Invalid connection provided to registerSchemaModels');
    return;
  }

  console.log('Registering schema models for school database connection...');
  
  try {
    // Register School model
    if (!connection.models['School']) {
      const schoolSchema = require('../models/schoolModel').schema;
      connection.model('School', schoolSchema);
      console.log('✅ School model registered');
    }
    
    // Register Direction model
    if (!connection.models['Direction']) {
      const directionSchema = require('../models/directionModel').schema;
      connection.model('Direction', directionSchema);
      console.log('✅ Direction model registered');
    }
    
    // Register Subject model
    if (!connection.models['Subject']) {
      const subjectSchema = require('../models/subjectModel').schema;
      connection.model('Subject', subjectSchema);
      console.log('✅ Subject model registered');
    }
    
    // Register anything else that might be needed for references
    // Add more models here as needed
    
    console.log('Schema models registration complete ✅');
  } catch (error) {
    console.error('Error registering schema models:', error);
  }
};

module.exports = registerSchemaModels;
