const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const { setSchoolContext } = require('./middleware/schoolIdMiddleware');
const { connectDB } = require('./config/db');
const webpush = require('web-push');

// Load environment variables
dotenv.config();

// Connect to the single MongoDB database for multi-tenancy
connectDB().then(async () => {
  console.log('MongoDB Connected with multi-tenant configuration'.cyan.bold);
  
  // Run migrations on startup
  try {
    // Update all admin users with correct permissions
    const migrationResult = await updateAllAdminPermissions();
    console.log(`Admin permissions migration result: ${migrationResult.updatedCount} users updated`.green);
  } catch (error) {
    console.error(`Migration error: ${error.message}`.red);
  }
}).catch(err => {
  console.error(`MongoDB Connection Error: ${err.message}`.red.bold);
  process.exit(1);
});

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

// Add middleware to handle API URLs with trailing slashes
// This must be added BEFORE the API routes
app.use((req, res, next) => {
  // Only apply to API routes with trailing slashes
  if (req.path.startsWith('/api/') && req.path.length > 5 && req.path.endsWith('/')) {
    // Remove the trailing slash and redirect
    const normalizedPath = req.path.slice(0, -1);
    console.log(`[API URL Normalizer] Redirecting ${req.path} to ${normalizedPath}`);
    
    // Preserve query parameters if any
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString() 
      : '';
      
    // 307 preserves the HTTP method (GET, POST, etc)
    return res.redirect(307, normalizedPath + queryString);
  }
  next();
});

// Health check endpoint for Render deployment
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// EMERGENCY DIAGNOSTIC ROUTE - for debugging deployment issues
app.get('/emergency-diagnostics', (req, res) => {
  console.log('EMERGENCY DIAGNOSTICS ENDPOINT ACCESSED');
  
  // Get information about the environment
  const diagnosticInfo = {
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoUriExists: !!process.env.MONGO_URI,
    jwtSecretExists: !!process.env.JWT_SECRET,
    headers: req.headers,
    buildDirectories: {
      staticPath: path.join(__dirname, '../frontend/build'),
      staticPathExists: require('fs').existsSync(path.join(__dirname, '../frontend/build')),
      indexPath: path.resolve(__dirname, '../', 'frontend', 'build', 'index.html'),
      indexPathExists: require('fs').existsSync(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')),
    },
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    time: new Date().toISOString()
  };
  
  if (diagnosticInfo.buildDirectories.staticPathExists) {
    try {
      // List files in build directory
      const files = require('fs').readdirSync(diagnosticInfo.buildDirectories.staticPath);
      diagnosticInfo.buildDirectories.files = files;
      
      // Check if index.html has content
      if (diagnosticInfo.buildDirectories.indexPathExists) {
        const indexContent = require('fs').readFileSync(diagnosticInfo.buildDirectories.indexPath, 'utf8');
        diagnosticInfo.buildDirectories.indexContentLength = indexContent.length;
        diagnosticInfo.buildDirectories.indexContentPreview = indexContent.substring(0, 100) + '...';
      }
    } catch (err) {
      diagnosticInfo.buildDirectories.error = err.message;
    }
  }
  
  // Create simple HTML response with diagnostic info
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GradeBook Emergency Diagnostics</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        h1 { color: #333; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>GradeBook Emergency Diagnostics</h1>
      <h2>Server Environment</h2>
      <pre>${JSON.stringify(diagnosticInfo, null, 2)}</pre>
      
      <h2>Manual Authentication Test</h2>
      <form id="authForm" action="/api/users/login" method="post">
        <div>
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div style="margin-top: 10px;">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div style="margin-top: 10px;">
          <button type="submit">Test Login</button>
        </div>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('authForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/api/users/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('result');
            if (response.ok) {
              resultDiv.innerHTML = 
                '<div class="success">Login Successful!</div>' +
                '<h3>Auth Data:</h3>' +
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              
              // Store token for testing
              localStorage.setItem('testToken', data.token);
              
              // Test a protected endpoint
              if (data.token) {
                const meResponse = await fetch('/api/users/me', {
                  headers: {
                    'Authorization': 'Bearer ' + data.token
                  }
                });
                
                const meData = await meResponse.json();
                resultDiv.innerHTML += 
                  '<h3>Protected Endpoint Test:</h3>' +
                  '<pre>' + JSON.stringify(meData, null, 2) + '</pre>';
              }
            } else {
              resultDiv.innerHTML = 
                '<div class="error">Login Failed</div>' +
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
          } catch (error) {
            document.getElementById('result').innerHTML = 
              '<div class="error">Error: ' + error.message + '</div>';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(htmlContent);
});

// Import logger for consistent detailed logging
const logger = require('./utils/logger');

// Import migrations
const { updateAllAdminPermissions } = require('./utils/migrations');

// User routes - No global middleware for auth checking, each route will handle individually
app.use('/api/users', require('./routes/userRoutes')); 

// Setup global middleware for the main routes - all routes here need auth & school context
const { protect } = require('./middleware/authMiddleware');
const { addFeatureFlags, checkCalendarEnabled, checkRatingEnabled } = require('./middleware/featureToggleMiddleware');

// Setup routes that need school context middlewares
// Add the feature flags middleware to all routes so they have access to feature information
app.use('/api/contacts', protect, setSchoolContext, addFeatureFlags, require('./routes/contactRoutes')); // Contact form
app.use('/api/patch-notes', protect, setSchoolContext, addFeatureFlags, require('./routes/patchNoteRoutes')); // Patch notes
app.use('/api/directions', protect, setSchoolContext, addFeatureFlags, require('./routes/directionRoutes')); // Directions API
app.use('/api/subjects', protect, setSchoolContext, addFeatureFlags, require('./routes/subjectRoutes')); // Subjects API
app.use('/api/students', protect, setSchoolContext, addFeatureFlags, require('./routes/studentRoutes')); // Students API
app.use('/api/grades', protect, setSchoolContext, addFeatureFlags, require('./routes/gradeRoutes')); // Grades API
app.use('/api/classes', protect, setSchoolContext, addFeatureFlags, require('./routes/classRoutes')); // Classes API (new)
app.use('/api/schedule', protect, setSchoolContext, addFeatureFlags, require('./routes/scheduleRoutes')); // Schedule API
app.use('/api/notifications', protect, setSchoolContext, addFeatureFlags, require('./routes/notificationRoutes')); // Notifications API

// Feature-toggled routes - these routes require specific features to be enabled
app.use('/api/ratings', protect, setSchoolContext, addFeatureFlags, checkRatingEnabled, require('./routes/ratingRoutes')); // Rating system API
app.use('/api/events', protect, setSchoolContext, addFeatureFlags, checkCalendarEnabled, require('./routes/eventRoutes')); // Calendar Events API

logger.info('SERVER', 'Routes configured with proper middleware ordering')

// Routes that may access multiple schools or don't require schoolId filtering
app.use('/api/schools', require('./routes/schoolRoutes')); // School routes have special handling
app.use('/api/schools/permissions', require('./routes/schoolPermissionsRoutes')); // School permissions management
app.use('/api/branches', protect, require('./routes/branchRoutes')); // School branch name lookups

// Migration routes for superadmins
app.use('/api/admin/migrations', require('./routes/migrationRoutes')); // Migration system for DB updates
app.use('/api/superadmin', require('./routes/superAdminRoutes')); // Superadmin routes bypass schoolId filtering
app.use('/api/ratings', require('./routes/ratingRoutes')); // Rating system for teachers and subjects

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
  possibleBuildPaths.forEach((pathToCheck, i) => {
    const exists = fs.existsSync(pathToCheck);
    console.log(`${i+1}. ${pathToCheck} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    if (exists && !staticPath) {
      staticPath = pathToCheck;
      indexPath = path.join(pathToCheck, 'index.html');
      
      // List files in build directory
      console.log('\nFiles in build directory:');
      try {
        const files = fs.readdirSync(pathToCheck);
        files.forEach(file => {
          console.log(`- ${file} ${fs.statSync(path.join(pathToCheck, file)).isDirectory() ? '(directory)' : ''}`);
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
    
    // First serve static files (important: this must come BEFORE the catch-all route)
    app.use(express.static(staticPath));

    // Add a special debug route to test if the server is serving static files correctly
    app.get('/appinfo', (req, res) => {
      res.json({
        success: true,
        message: 'App info debug endpoint',
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        availableRoutes: [
          '/app',
          '/app/profile',
          '/app/notifications',
          '/dashboard'
        ]
      });
    });

    // CRITICAL: Make sure API routes are defined BEFORE the catch-all route
    // This is already done above with app.use('/api/...')

    // Define known protected route patterns that need special handling
    const protectedRoutePatterns = [
      '/app/*',
      '/admin*',
      '/teacher*',
      '/profile',
      '/notifications',
      '/grades*',
      '/settings*',
      '/dashboard'
    ];
    
    // Handle all protected routes
    protectedRoutePatterns.forEach(pattern => {
      if (pattern === '/app/*') {
        // Handle /app/* directly without redirection
        app.get('/app/*', (req, res) => {
          console.log(`Serving index.html for ${pattern} route: ${req.originalUrl}`);
          if (!fs.existsSync(indexPath)) {
            console.error('ERROR: index.html does not exist at path:', indexPath);
            return res.status(500).send('Frontend build files not found. Please check server configuration.');
          }
          return res.sendFile(indexPath);
        });
      } else {
        // Add redirection for routes that should be under /app
        const basePattern = pattern.replace('*', '');
        app.get(pattern, (req, res) => {
          const targetUrl = `/app${req.originalUrl}`;
          console.log(`Redirecting ${basePattern} route to ${targetUrl}`);
          return res.redirect(targetUrl);
        });
      }
    });
    
    // Add special route for dashboard
    app.get('/dashboard', (req, res) => {
      console.log('Redirecting /dashboard to /app/dashboard');
      return res.redirect('/app/dashboard');
    });
    
    // IMPORTANT: Fix the order of middleware - this must be the LAST middleware registered!
    // For all other routes, serve index.html
    app.use('*', (req, res, next) => {
      // CRITICAL: Don't intercept API routes - they should be handled by their own handlers
      if (req.originalUrl.startsWith('/api/')) {
        console.log(`API route detected, skipping catch-all for: ${req.originalUrl}`);
        return next();
      }
      
      console.log(`Serving index.html for client-side route: ${req.originalUrl}`);
      
      if (!fs.existsSync(indexPath)) {
        console.error('ERROR: index.html does not exist at path:', indexPath);
        return res.status(500).send('Frontend build files not found. Please check server configuration.');
      }
      
      // Send the React app's index.html for all client-side routes
      return res.sendFile(indexPath);
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
