const express = require('express');
const router = express.Router();
const {
  createPatchNote,
  getPatchNotes,
  getPatchNoteById,
  updatePatchNote,
  deletePatchNote
} = require('../controllers/patchNoteController');
const { protect, admin, superadmin } = require('../middleware/authMiddleware');

// Create middleware for admin or superadmin access
const adminOrSuperadmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  res.status(403);
  throw new Error('Access denied. Admin or superadmin role required.');
};

router.route('/')
  .get(protect, getPatchNotes)
  .post(protect, adminOrSuperadmin, createPatchNote);

router.route('/:id')
  .get(protect, getPatchNoteById)
  .put(protect, adminOrSuperadmin, updatePatchNote)
  .delete(protect, adminOrSuperadmin, deletePatchNote);

module.exports = router;
