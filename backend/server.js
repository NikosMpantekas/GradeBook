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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../frontend/build');
  const indexPath = path.resolve(__dirname, '../', 'frontend', 'build', 'index.html');
  
  console.log('Static files path:', staticPath);
  console.log('Index.html path:', indexPath);
  console.log('Checking if index.html exists:', require('fs').existsSync(indexPath) ? 'YES' : 'NO');
  
  app.use(express.static(staticPath));

  app.get('*', (req, res) => {
    console.log('Received request for:', req.originalUrl);
    
    // Log if we're trying to serve a non-existent file
    if (!require('fs').existsSync(indexPath)) {
      console.error('ERROR: index.html does not exist at path:', indexPath);
      return res.status(500).send('Frontend build files not found. Please check server configuration.');
    }
    
    res.sendFile(indexPath);
  });
} else {
  app.get('/', (req, res) => res.send('API is running...'));
}

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
