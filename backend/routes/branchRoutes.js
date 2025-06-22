const express = require('express');
const router = express.Router();
const { getBranchById, getBranchesByIds } = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected - require authentication
router.use(protect);

// Get a single branch by ID
router.get('/:id', getBranchById);

// Get multiple branches by IDs in request body
router.post('/batch', getBranchesByIds);

module.exports = router;
