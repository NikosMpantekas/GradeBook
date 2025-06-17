const express = require('express');
const router = express.Router();
const { protect, superadmin } = require('../middleware/authMiddleware');
const { 
  runMigration,
  getMigrations
} = require('../controllers/migrationController');

// All routes require superadmin access
router.use(protect);
router.use(superadmin);

// Get available migrations and their status
router.get('/', getMigrations);

// Run a specific migration
router.post('/run', runMigration);

module.exports = router;
