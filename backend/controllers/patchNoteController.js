const asyncHandler = require('express-async-handler');
const PatchNote = require('../models/patchNoteModel');

// @desc    Create a new patch note
// @route   POST /api/patch-notes
// @access  Private (superadmin only)
const createPatchNote = asyncHandler(async (req, res) => {
  const { title, content, version, type } = req.body;
  
  // Validate input
  if (!title || !content || !version) {
    res.status(400);
    throw new Error('Please include title, content and version');
  }

  // Check if user is superadmin
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to create patch notes');
  }

  try {
    // Create the patch note
    const patchNote = await PatchNote.create({
      title,
      content,
      version,
      type: type || 'release',
      publishedBy: req.user._id,
      isActive: true
    });
    
    console.log('Patch note created:', {
      id: patchNote._id,
      title: patchNote.title,
      version: patchNote.version
    });
    
    res.status(201).json(patchNote);
  } catch (error) {
    console.error('Error creating patch note:', error);
    res.status(500);
    throw new Error('Failed to create patch note: ' + error.message);
  }
});

// @desc    Get all patch notes
// @route   GET /api/patch-notes
// @access  Private (all authenticated users)
const getPatchNotes = asyncHandler(async (req, res) => {
  try {
    // Non-superadmins only see active patch notes
    const filter = req.user.role !== 'superadmin' ? { isActive: true } : {};
    
    // Get all patch notes, newest first
    const patchNotes = await PatchNote.find(filter)
      .sort({ createdAt: -1 })
      .populate('publishedBy', 'name')
      .lean();
    
    res.status(200).json(patchNotes);
  } catch (error) {
    console.error('Error retrieving patch notes:', error);
    res.status(500);
    throw new Error('Failed to retrieve patch notes: ' + error.message);
  }
});

// @desc    Get a single patch note by ID
// @route   GET /api/patch-notes/:id
// @access  Private (all authenticated users)
const getPatchNoteById = asyncHandler(async (req, res) => {
  try {
    const patchNote = await PatchNote.findById(req.params.id)
      .populate('publishedBy', 'name')
      .lean();
    
    if (!patchNote) {
      res.status(404);
      throw new Error('Patch note not found');
    }
    
    // Non-superadmins can only see active patch notes
    if (req.user.role !== 'superadmin' && !patchNote.isActive) {
      res.status(404);
      throw new Error('Patch note not found');
    }
    
    res.status(200).json(patchNote);
  } catch (error) {
    console.error('Error retrieving patch note:', error);
    res.status(500);
    throw new Error('Failed to retrieve patch note: ' + error.message);
  }
});

// @desc    Update a patch note
// @route   PUT /api/patch-notes/:id
// @access  Private (superadmin only)
const updatePatchNote = asyncHandler(async (req, res) => {
  // Check if user is superadmin
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to update patch notes');
  }

  try {
    const { title, content, version, type, isActive } = req.body;
    
    // Find the patch note first
    const patchNote = await PatchNote.findById(req.params.id);
    
    if (!patchNote) {
      res.status(404);
      throw new Error('Patch note not found');
    }
    
    // Update the fields
    if (title !== undefined) patchNote.title = title;
    if (content !== undefined) patchNote.content = content;
    if (version !== undefined) patchNote.version = version;
    if (type !== undefined) patchNote.type = type;
    if (isActive !== undefined) patchNote.isActive = isActive;
    
    // Save the updated patch note
    await patchNote.save();
    
    console.log('Patch note updated:', {
      id: patchNote._id,
      title: patchNote.title,
      version: patchNote.version,
      isActive: patchNote.isActive
    });
    
    res.status(200).json(patchNote);
  } catch (error) {
    console.error('Error updating patch note:', error);
    res.status(500);
    throw new Error('Failed to update patch note: ' + error.message);
  }
});

// @desc    Delete a patch note
// @route   DELETE /api/patch-notes/:id
// @access  Private (superadmin only)
const deletePatchNote = asyncHandler(async (req, res) => {
  // Check if user is superadmin
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to delete patch notes');
  }

  try {
    // Find and delete the patch note
    const patchNote = await PatchNote.findById(req.params.id);
    
    if (!patchNote) {
      res.status(404);
      throw new Error('Patch note not found');
    }
    
    await patchNote.deleteOne();
    
    console.log('Patch note deleted:', {
      id: req.params.id
    });
    
    res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error deleting patch note:', error);
    res.status(500);
    throw new Error('Failed to delete patch note: ' + error.message);
  }
});

module.exports = {
  createPatchNote,
  getPatchNotes,
  getPatchNoteById,
  updatePatchNote,
  deletePatchNote
};
