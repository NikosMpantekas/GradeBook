const express = require('express');
const router = express.Router();
const {
  createPatchNote,
  getPatchNotes,
  getPatchNoteById,
  updatePatchNote,
  deletePatchNote
} = require('../controllers/patchNoteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPatchNotes)
  .post(protect, createPatchNote);

router.route('/:id')
  .get(protect, getPatchNoteById)
  .put(protect, updatePatchNote)
  .delete(protect, deletePatchNote);

module.exports = router;
