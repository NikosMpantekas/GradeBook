const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const School = require('../models/schoolModel');

// @desc    Get school branch data by ID
// @route   GET /api/branches/:id
// @access  Private
const getBranchById = asyncHandler(async (req, res) => {
  try {
    const branchId = req.params.id;
    console.log(`Looking up school branch with ID: ${branchId}`);
    
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      console.log(`Invalid branch ID format: ${branchId}`);
      return res.status(400).json({ 
        message: 'Invalid branch ID format',
        originalId: branchId 
      });
    }
    
    const school = await School.findById(branchId).select('_id name');
    
    if (!school) {
      console.log(`School branch not found for ID: ${branchId}`);
      return res.status(404).json({ 
        message: 'School branch not found',
        originalId: branchId
      });
    }
    
    console.log(`Found school branch: ${school.name} for ID: ${branchId}`);
    res.json({
      _id: school._id,
      name: school.name
    });
    
  } catch (error) {
    console.error(`Error in getBranchById: ${error.message}`);
    res.status(500).json({ 
      message: error.message,
      originalId: req.params.id
    });
  }
});

// @desc    Get multiple school branches by IDs
// @route   POST /api/branches/batch
// @access  Private
const getBranchesByIds = asyncHandler(async (req, res) => {
  try {
    const { branchIds } = req.body;
    console.log(`Looking up ${branchIds?.length || 0} school branches`);
    
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: 'No branch IDs provided' });
    }
    
    // Filter valid ObjectIds
    const validIds = branchIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    console.log(`Found ${validIds.length} valid branch IDs out of ${branchIds.length}`);
    
    if (validIds.length === 0) {
      return res.json({ branches: [] });
    }
    
    const schools = await School.find({
      _id: { $in: validIds }
    }).select('_id name');
    
    // Create a mapping for quick lookup
    const branchMap = {};
    schools.forEach(school => {
      branchMap[school._id.toString()] = {
        _id: school._id,
        name: school.name
      };
    });
    
    console.log(`Successfully found ${schools.length} branches`);
    
    // Return both the map and array for flexibility
    res.json({
      branches: schools.map(s => ({ _id: s._id, name: s.name })),
      branchMap
    });
    
  } catch (error) {
    console.error(`Error in getBranchesByIds: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getBranchById,
  getBranchesByIds
};
