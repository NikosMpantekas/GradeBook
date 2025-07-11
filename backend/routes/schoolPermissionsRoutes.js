const express = require('express');
const router = express.Router();

// REMOVED: Legacy School Permissions System
// This file is kept as a placeholder to maintain backward compatibility
// All school permission/feature restriction logic has been completely removed
// as per user requirements. A new, correct superadmin-controlled feature toggle 
// system will be implemented instead.

// Return a standard response for any route to avoid breaking client calls
router.use('*', (req, res) => {
  res.status(200).json({
    message: 'School permissions system has been removed. All features are now enabled by default.',
    migrating: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
