const mongoose = require('mongoose');
const { registerSchoolModels } = require('./schoolModelRegistration');

// Store database connections for each school
const schoolConnections = new Map();

// Store registered models for each school
const schoolModels = new Map();

// Debug function to list all available databases
const listAllDatabases = async (connection) => {
  try {
    if (!connection || !connection.db) {
      console.log('Cannot list databases - no valid connection');
      return [];
    }
    
    const admin = connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name).join(', '));
    return dbs.databases;
  } catch (error) {
    console.error('Error listing databases:', error.message);
    return [];
  }
};

// Connect to a school-specific database with reliability improvements
const connectToSchoolDb = async (school) => {
  // CRITICAL FIX: Better validation of school object
  if (!school || !school._id) {
    console.error('Invalid school object provided to connectToSchoolDb:', school);
    throw new Error('Invalid school object - database connection failed');
  }

  const schoolId = school._id.toString();
  console.log(`Attempting connection to school database [ID: ${schoolId}] for ${school.name || 'Unknown School'}`);
  
  // OPTIMIZATION: Use a timestamp-based cache expiration system
  // Get the current time to check connection age
  const now = Date.now();
  const CONNECTION_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
  
  // Check if we have a cached connection that's still valid
  if (schoolConnections.has(schoolId)) {
    const { connection: existingConnection, timestamp, models: cachedModels } = schoolConnections.get(schoolId);
    const connectionAge = now - timestamp;
    
    // Skip ping check if connection is fresh (under 30 seconds old)
    if (connectionAge < 30000 && existingConnection.readyState === 1) {
      console.log(`✅ Using recent connection for school: ${school.name} (${Math.round(connectionAge/1000)}s old)`);
      return {
        connection: existingConnection,
        models: cachedModels || {}
      };
    }
    
    // For older connections, check if still alive but not too old
    if (connectionAge < CONNECTION_MAX_AGE_MS && existingConnection.readyState === 1) {
      try {
        // Fast check if connection is still usable
        if (existingConnection.db) {
          // Update timestamp to extend the connection life
          schoolConnections.set(schoolId, { 
            connection: existingConnection, 
            timestamp: now,
            models: cachedModels
          });
          
          console.log(`✅ Reusing existing connection for school: ${school.name} (${Math.round(connectionAge/1000)}s old)`);
          return {
            connection: existingConnection,
            models: cachedModels || {}
          };
        }
      } catch (err) {
        // Connection is broken, will create a new one
        console.log(`⚠️ Connection test failed for school: ${school.name}, creating new one`);
      }
    } else {
      // Connection too old or not in ready state
      if (connectionAge >= CONNECTION_MAX_AGE_MS) {
        console.log(`⚠️ Connection expired for school: ${school.name} (${Math.round(connectionAge/1000)}s old)`);
      } else {
        console.log(`⚠️ Connection not ready for school: ${school.name}, state: ${existingConnection.readyState}`);
      }
    }
    
    // Close the existing connection gracefully before creating a new one
    try {
      if (existingConnection && existingConnection.close) {
        await existingConnection.close();
        console.log(`Closed stale connection for school: ${school.name}`);
      }
    } catch (closeError) {
      console.warn(`Unable to close connection for ${school.name}:`, closeError.message);
    }
    
    // Remove references to stale connection and models
    schoolConnections.delete(schoolId);
    schoolModels.delete(schoolId);
  }

  try {
    // Use school's database URI if available, otherwise use main URI with school's dbName
    let connectionUri;
    
    // First, try to get from dbConfig
    if (school.dbConfig && school.dbConfig.uri) {
      connectionUri = school.dbConfig.uri;
    }
    // If no specific URI provided, construct one from main URI and school dbName
    else if (school.dbConfig && school.dbConfig.dbName) {
      // Extract the base URI from the main connection
      const mainUri = process.env.MONGO_URI;
      
      // CRITICAL FIX: Preserve query parameters when replacing database name
      // Parse the URI to correctly handle the database name and query parameters
      if (mainUri.includes('?')) {
        // URI has query parameters - need to preserve them
        const [uriBase, queryParams] = mainUri.split('?');
        // Replace the database name in the base part
        const baseWithNewDb = uriBase.replace(/\/[^\/]*$/, `/${school.dbConfig.dbName}`);
        // Reconstruct URI with query parameters
        connectionUri = `${baseWithNewDb}?${queryParams}`;
      } else {
        // No query parameters, just replace database name
        connectionUri = mainUri.replace(/\/[^\/]*$/, `/${school.dbConfig.dbName}`);
      }
    }
    // If still no URI, use main URI with school ID as database name
    else {
      const mainUri = process.env.MONGO_URI;
      
      // CRITICAL FIX: Preserve query parameters when replacing database name
      if (mainUri.includes('?')) {
        // URI has query parameters - need to preserve them
        const [uriBase, queryParams] = mainUri.split('?');
        // Replace the database name in the base part
        const baseWithNewDb = uriBase.replace(/\/[^\/]*$/, `/${schoolId}`);
        // Reconstruct URI with query parameters
        connectionUri = `${baseWithNewDb}?${queryParams}`;
      } else {
        // No query parameters, just replace database name
        connectionUri = mainUri.replace(/\/[^\/]*$/, `/${schoolId}`);
      }
    }
    
    console.log(`CRITICAL FIX: Connecting to school database: ${school.name} with URI pattern: ${connectionUri.replace(/:[^:@]*@/, ':****@')}`);
    
    // Implement retry logic for better reliability
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let connection;
    let registeredModels = {}; // Define models at the correct scope for the entire function
    
    while (retryCount < MAX_RETRIES) {
      try {
        // Connect to the school database with improved options
        connection = await mongoose.createConnection(connectionUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 10000, // Increase timeout for better reliability
          heartbeatFrequencyMS: 30000,     // More frequent heartbeats
          socketTimeoutMS: 45000,          // Longer socket timeout
          family: 4,                       // Force IPv4
          maxPoolSize: 10                  // Increase connection pool
        });
        
        console.log(`Successfully connected to database for school: ${school.name}`);
          
        try {
          // ENHANCED: List all collections in the database to debug
          const collections = await connection.db.listCollections().toArray();
          console.log(`School database has ${collections.length} collections:`, 
            collections.map(c => c.name).join(', '));
            
          // Try to list all databases to debug
          await listAllDatabases(connection);
        } catch (listError) {
          console.warn('Error listing collections:', listError.message);
        }
          
        // CRITICAL FIX: Register models for this connection with improved error handling
        try {
          registeredModels = registerSchoolModels(connection);
          console.log('Successfully registered models for school database');
            
          // Verify models were registered properly
          if (Object.keys(registeredModels).length > 0) {
            console.log('Registered models:', Object.keys(registeredModels).join(', '));
          } else {
            console.error(`❌ Failed to register models for ${school.name}`);
            registeredModels = {}; // Ensure we have at least an empty object
          }
        } catch (schemaError) {
          console.error(`❌ Error registering models for ${school.name}:`, schemaError);
          registeredModels = {}; // Reset to empty object on error
        }
        
        // CRITICAL FIX: Test connection without relying on database features
        // First, verify the connection object exists
        if (!connection) {
          throw new Error('Connection object is null or undefined');
        }
        
        // Wait for connection to be established (mongoose Connection events)
        await new Promise((resolve, reject) => {
          // If already connected, resolve immediately
          if (connection.readyState === 1) {
            console.log('Connection already established');
            return resolve();
          }
          
          // Set up event listeners for connection
          connection.once('connected', () => {
            console.log(`Connection established to ${school.name} database`);
            resolve();
          });
          
          connection.once('error', (err) => {
            console.error(`Connection error for ${school.name} database:`, err);
            reject(err);
          });
          
          // Set timeout to avoid hanging forever
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout - took too long to connect'));
          }, 5000);
          
          // Clean up timeout if connected or error
          connection.once('connected', () => clearTimeout(timeout));
          connection.once('error', () => clearTimeout(timeout));
        });
        
        console.log(`✅ Successfully connected to school database: ${school.name} (attempt ${retryCount + 1})`);
        
        // Store the connection with a timestamp for efficient reuse
        schoolConnections.set(schoolId, {
          connection,
          timestamp: Date.now(),
          models: registeredModels
        });
        
        // Return both connection and models
        return {
          connection,
          models: registeredModels
        };
      } catch (error) {
        retryCount++;
        console.error(`⚠️ Database connection attempt ${retryCount} failed for school: ${school.name}. Error: ${error.message}`);
        
        if (retryCount >= MAX_RETRIES) {
          console.error(`❌ All connection attempts failed for school: ${school.name}. Giving up.`);
          throw new Error(`Failed to connect to school database after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  } catch (error) {
    console.error(`Error connecting to school database for ${school.name}: ${error.message}`);
    throw error;
  }
};

// Get a school-specific connection if it already exists
// Returns both the connection and registered models
const getSchoolConnection = (schoolId) => {
  if (!schoolId) {
    console.error('Invalid schoolId provided to getSchoolConnection');
    return { connection: null, models: {} };
  }
  
  const connectionId = typeof schoolId === 'object' ? schoolId.toString() : schoolId.toString();
  
  if (schoolConnections.has(connectionId)) {
    // Get the cached connection data with timestamp and models
    const { connection, models, timestamp } = schoolConnections.get(connectionId);
    
    // Check if connection is still valid
    if (connection && connection.readyState === 1) {
      // Update the timestamp to extend connection life
      schoolConnections.set(connectionId, {
        connection,
        timestamp: Date.now(),
        models
      });
      
      // Return both connection and models
      return {
        connection,
        models: models || {}
      };
    }
    
    // Connection is stale or invalid
    console.log(`Found invalid connection for ${connectionId}, readyState: ${connection ? connection.readyState : 'null'}`);
    schoolConnections.delete(connectionId);
  }
  
  console.log(`No cached connection found for school ID: ${connectionId}`);
  return { connection: null, models: {} };
};

// Get all active school connections
const getAllSchoolConnections = () => {
  const activeConnections = [];
  
  for (const [schoolId, connection] of schoolConnections.entries()) {
    if (connection.readyState === 1) {
      activeConnections.push({
        schoolId,
        connection
      });
    } else {
      // Clean up stale connections
      console.log(`Found stale connection for school ID: ${schoolId}, removing it`);
      schoolConnections.delete(schoolId);
    }
  }
  
  return activeConnections;
};

// Close all school database connections
const closeAllSchoolConnections = async () => {
  const closePromises = [];
  
  for (const [schoolId, connection] of schoolConnections.entries()) {
    if (connection.readyState === 1) {
      console.log(`Closing connection for school ID: ${schoolId}`);
      closePromises.push(connection.close());
    }
  }
  
  await Promise.all(closePromises);
  schoolConnections.clear();
  console.log('All school database connections closed');
};

module.exports = {
  connectToSchoolDb,
  getSchoolConnection,
  getAllSchoolConnections,
  closeAllSchoolConnections,
};
