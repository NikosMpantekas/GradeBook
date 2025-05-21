const mongoose = require('mongoose');
const registerSchemaModels = require('./registerSchemaModels');

// Store database connections for each school
const schoolConnections = new Map();

// Connect to a school-specific database with reliability improvements
const connectToSchoolDb = async (school) => {
  // CRITICAL FIX: Better validation of school object
  if (!school || !school._id) {
    console.error('Invalid school object provided to connectToSchoolDb:', school);
    throw new Error('Invalid school object - database connection failed');
  }

  const schoolId = school._id.toString();
  console.log(`Attempting connection to school database [ID: ${schoolId}] for ${school.name || 'Unknown School'}`);
  
  // If already connected, return the existing connection but verify it's working properly
  if (schoolConnections.has(schoolId)) {
    const existingConnection = schoolConnections.get(schoolId);
    
    // Check if connection is still alive and healthy
    if (existingConnection.readyState === 1) {
      try {
        // Verify connection by executing a simple command
        await existingConnection.db.admin().ping();
        console.log(`✅ Connection verified for school: ${school.name}`);
        return existingConnection;
      } catch (pingError) {
        console.warn(`⚠️ Connection test failed for school: ${school.name}, creating a new one. Error: ${pingError.message}`);
        schoolConnections.delete(schoolId); // Remove unhealthy connection
      }
    } else {
      console.warn(`⚠️ Stale connection found for school: ${school.name}, creating a new one`);
      schoolConnections.delete(schoolId); // Remove stale connection
    }
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
        
        // Register all required schema models in this connection
        // This is critical for populate() to work properly with references
        registerSchemaModels(connection);
        
        console.log(`Connection to school database ${school.name} successful!`);
        
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
        
        console.log(`\u2705 Successfully connected to school database: ${school.name} (attempt ${retryCount + 1})`);
        
        // Cache the connection
        schoolConnections.set(schoolId, connection);
        return connection;
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
const getSchoolConnection = (schoolId) => {
  if (!schoolId) return null;
  
  const connectionId = typeof schoolId === 'object' ? schoolId.toString() : schoolId.toString();
  
  if (schoolConnections.has(connectionId)) {
    const connection = schoolConnections.get(connectionId);
    
    // Check if the connection is still alive before returning it
    if (connection.readyState === 1) {
      return connection;
    } else {
      console.log(`Found stale connection for school ID: ${connectionId}, removing it`);
      schoolConnections.delete(connectionId);
      return null;
    }
  }
  
  return null;
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
