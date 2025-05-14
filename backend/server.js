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
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(
      path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')
    )
  );
} else {
  app.get('/', (req, res) => res.send('API is running...'));
}

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
