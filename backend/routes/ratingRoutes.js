const express = require('express');
const router = express.Router();

// GET wildcard route to handle all GET requests
router.get('*', (req, res) => {
  res.status(200).json([]);
});

// POST wildcard route to handle all POST requests
router.post('*', (req, res) => {
  res.status(200).json({ message: 'Operation temporarily disabled' });
});

// PUT wildcard route to handle all PUT requests
router.put('*', (req, res) => {
  res.status(200).json({ message: 'Operation temporarily disabled' });
});

// DELETE wildcard route to handle all DELETE requests
router.delete('*', (req, res) => {
  res.status(200).json({ message: 'Operation temporarily disabled' });
});

module.exports = router;
