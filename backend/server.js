const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const webpush = require('web-push');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Set up web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/directions', require('./routes/directionRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    // Log request body but hide sensitive info
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
    console.log('Request body:', JSON.stringify(sanitizedBody));
  }
  next();
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // List all files in the directory to debug
  const fs = require('fs');
  
  // Try multiple possible build locations
  const possibleBuildPaths = [
    path.join(__dirname, '../frontend/build'),
    path.join(__dirname, '../build'),
    path.join(__dirname, '../../frontend/build'),
    path.join(__dirname, '/frontend/build')
  ];

  let staticPath = null;
  let indexPath = null;

  console.log('Looking for build directory in these locations:');
  possibleBuildPaths.forEach((path, i) => {
    const exists = fs.existsSync(path);
    console.log(`${i+1}. ${path} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists && !staticPath) {
      staticPath = path;
      indexPath = path + '/index.html';
      
      // List files in build directory
      console.log('\nFiles in build directory:');
      try {
        const files = fs.readdirSync(path);
        files.forEach(file => {
          console.log(`- ${file} ${fs.statSync(`${path}/${file}`).isDirectory() ? '(directory)' : ''}`);
        });
      } catch (err) {
        console.error('Error reading directory:', err);
      }
    }
  });

  if (staticPath) {
    console.log('\nUsing static files from:', staticPath);
    console.log('Index.html path:', indexPath);
    console.log('Checking if index.html exists:', fs.existsSync(indexPath) ? 'YES' : 'NO');
    
    // Serve static files
    app.use(express.static(staticPath));

    // For all other routes, serve index.html
    app.get('*', (req, res) => {
      console.log(`Serving index.html for: ${req.originalUrl}`);
      
      if (!fs.existsSync(indexPath)) {
        console.error('ERROR: index.html does not exist at path:', indexPath);
        return res.status(500).send('Frontend build files not found. Please check server configuration.');
      }
      
      res.sendFile(indexPath);
    });
  } else {
    console.error('CRITICAL ERROR: Could not find build directory in any location!');
    app.get('*', (req, res) => {
      res.status(500).send('Build directory not found. Please check deployment configuration.');
    });
  }
} else {
  app.get('/', (req, res) => res.send('API is running...'));
}

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
