const express = require('express');
const router = express.Router();

// Super minimal routes file
// Respond with empty/basic response for all routes

// GET routes
router.get('*', (req, res) => {
  res.status(200).json([]);
});

// POST routes 
router.post('*', (req, res) => {
  res.status(200).json({ message: 'Feature temporarily disabled' });
});

// PUT routes
router.put('*', (req, res) => {
  res.status(200).json({ message: 'Feature temporarily disabled' });
});

// DELETE routes
router.delete('*', (req, res) => {
  res.status(200).json({ message: 'Feature temporarily disabled' });
});

module.exports = router;
