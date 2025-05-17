const mongoose = require('mongoose');
const colors = require('colors');

// Store connections to each tenant database
const connections = {};

// Main connection (for authentication and tenant management)
let mainConnection;

// Cache of models to avoid repeated compilation
const models = {};

/**
 * Connect to the main database
 * @returns {Promise<mongoose.Connection>}
 */
const connectMainDB = async () => {
  try {
    if (!mainConnection || mainConnection.readyState !== 1) { // 1 = connected
      mainConnection = await mongoose.createConnection(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log(`Main database connected: ${mainConnection.name}`.cyan.underline);
      
      // Register disconnect handler
      mainConnection.on('disconnected', () => {
        console.log('Main database disconnected - will reconnect on next request'.yellow);
        mainConnection = null;
      });
      
      // Register error handler
      mainConnection.on('error', (err) => {
        console.error(`Main database error: ${err}`.red);
      });
    }
    return mainConnection;
  } catch (error) {
    console.error(`Error connecting to main database: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

/**
 * Connect to a tenant's database
 * @param {string} tenantId - ID of the tenant
 * @param {string} dbName - Database name (optional, will use tenantId if not provided)
 * @returns {Promise<mongoose.Connection>}
 */
const connectTenantDB = async (tenantId, dbName = null) => {
  try {
    // For the main database, just return the main connection
    if (tenantId === 'main') {
      return await connectMainDB();
    }
    
    // If we already have this connection and it's connected, return it
    if (connections[tenantId] && connections[tenantId].readyState === 1) {
      return connections[tenantId];
    }

    // Get the main connection to access the Tenant model
    const main = await connectMainDB();
    
    // Check if we have a Tenant model in the main connection
    let Tenant;
    if (main.models.Tenant) {
      Tenant = main.models.Tenant;
    } else {
      // If we don't have the model yet, we need to load it
      const tenantSchema = require('../models/tenantModel');
      Tenant = main.model('Tenant', tenantSchema);
    }

    // Find the tenant to get database URI
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    
    // If tenant is not active, throw an error
    if (tenant.status !== 'active') {
      throw new Error(`Tenant ${tenant.name} (${tenantId}) is not active`);
    }

    // Connect to the tenant's database
    const dbUri = tenant.dbUri || process.env.MONGO_URI;
    const actualDbName = dbName || `tenant_${tenantId}`;

    // Extract the base URI without database name
    const baseUri = dbUri.substring(0, dbUri.lastIndexOf('/'));
    const tenantDbUri = `${baseUri}/${actualDbName}`;

    // Create a new connection
    connections[tenantId] = await mongoose.createConnection(tenantDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Register disconnect handler
    connections[tenantId].on('disconnected', () => {
      console.log(`Tenant database ${tenantId} disconnected - will reconnect on next request`.yellow);
      delete connections[tenantId];
    });
    
    // Register error handler
    connections[tenantId].on('error', (err) => {
      console.error(`Tenant database ${tenantId} error: ${err}`.red);
    });

    console.log(`Tenant database connected: ${connections[tenantId].name}`.green.underline);
    return connections[tenantId];
  } catch (error) {
    console.error(
      `Error connecting to tenant database ${tenantId}: ${error.message}`.red.underline.bold
    );
    throw error;
  }
};

/**
 * Get a model from the specified database
 * @param {string} dbId - 'main' for main database or tenant ID
 * @param {string} modelName - Name of the model
 * @param {mongoose.Schema} schema - Mongoose schema for the model
 * @returns {Promise<mongoose.Model>}
 */
const getModel = async (dbId, modelName, schema) => {
  try {
    // Enhanced logging to troubleshoot schema issues
    console.log(`Attempting to get model ${modelName} for database ${dbId}`);
    
    // Cache check - if we already have this model for this tenant
    if (models[dbId] && models[dbId][modelName]) {
      console.log(`Using cached model ${modelName} for ${dbId}`);
      return models[dbId][modelName];
    }
    
    // Initialize model cache for this tenant if needed
    if (!models[dbId]) {
      models[dbId] = {};
    }

    // Get the right connection
    let connection;
    try {
      connection = dbId === 'main' ? 
        await connectMainDB() : 
        await connectTenantDB(dbId);
        
      console.log(`Successfully connected to database for ${dbId}`);
    } catch (connErr) {
      console.error(`Connection error for ${dbId}:`, connErr);
      throw connErr;
    }

    // Check if the model already exists in this connection
    if (connection.models[modelName]) {
      // Use existing model if it already exists
      const model = connection.models[modelName];
      console.log(`Using existing model ${modelName} from connection`);
      
      // Cache the model for future use
      models[dbId][modelName] = model;
      return model;
    }
    
    // Validate schema before creating a model
    if (!schema) {
      console.error(`No schema provided for model ${modelName}`);
      throw new Error(`No schema provided for model ${modelName}`);
    }
    
    // More robust schema validation
    if (typeof schema !== 'object' || (!schema.obj && !schema.paths)) {
      console.error(`Invalid schema structure for ${modelName}:`, typeof schema);
      
      // Try to load schema directly from models directory if available
      try {
        console.log(`Attempting to load ${modelName} schema from models directory`);
        const loadedSchema = require(`../models/${modelName.toLowerCase()}Model`);
        
        if (loadedSchema && (loadedSchema.obj || loadedSchema.paths)) {
          console.log(`Successfully loaded schema for ${modelName} from models directory`);
          schema = loadedSchema;
        } else {
          throw new Error(`Loaded schema for ${modelName} is invalid`);
        }
      } catch (schemaLoadErr) {
        console.error(`Failed to load schema for ${modelName} from models:`, schemaLoadErr.message);
        throw new Error(`Invalid schema provided for model ${modelName}`);
      }
    }

    // Create a new model with the schema
    console.log(`Creating new model ${modelName} for ${dbId}`);
    const model = connection.model(modelName, schema);
    
    // Cache the model for future use
    models[dbId][modelName] = model;
    
    console.log(`Successfully created and cached model ${modelName} for ${dbId}`);
    return model;
  } catch (error) {
    console.error(
      `Error getting model ${modelName} from database ${dbId}: ${error.message}`.red.underline.bold
    );
    throw error;
  }
};

/**
 * Initialize tenant databases and ensure required collections exist
 * @param {string} tenantId - ID of the tenant
 * @returns {Promise<void>}
 */
const initializeTenantDatabase = async (tenantId) => {
  try {
    if (tenantId === 'main') {
      throw new Error('Cannot initialize main database through this function');
    }
    
    console.log(`Initializing database for tenant ${tenantId}...`.yellow);
    
    // Connect to the tenant DB
    const connection = await connectTenantDB(tenantId);
    
    // Load all schemas we need to initialize
    const userSchema = require('../models/userModel');
    const schoolSchema = require('../models/schoolModel');
    const directionSchema = require('../models/directionModel');
    const subjectSchema = require('../models/subjectModel');
    const gradeSchema = require('../models/gradeModel');
    
    // Initialize the models (this creates the collections if they don't exist)
    connection.model('User', userSchema);
    connection.model('School', schoolSchema);
    connection.model('Direction', directionSchema);
    connection.model('Subject', subjectSchema);
    connection.model('Grade', gradeSchema);
    
    console.log(`Database initialized for tenant ${tenantId}`.green);
  } catch (error) {
    console.error(`Error initializing database for tenant ${tenantId}: ${error.message}`.red.bold);
    throw error;
  }
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
const closeAllConnections = async () => {
  try {
    // Close main connection if it exists
    if (mainConnection) {
      await mainConnection.close();
      console.log('Main database connection closed'.yellow);
      mainConnection = null;
    }
    
    // Close all tenant connections
    const tenantIds = Object.keys(connections);
    for (const tenantId of tenantIds) {
      await connections[tenantId].close();
      console.log(`Tenant database ${tenantId} connection closed`.yellow);
      delete connections[tenantId];
    }
    
    // Clear the models cache too
    Object.keys(models).forEach(key => delete models[key]);
    
    console.log('All database connections closed'.green);
  } catch (error) {
    console.error(`Error closing database connections: ${error.message}`.red.bold);
    throw error;
  }
};

module.exports = { 
  connectMainDB, 
  connectTenantDB, 
  getModel, 
  initializeTenantDatabase,
  closeAllConnections,
  getModelForTenant: getModel, // Alias for backward compatibility
};
