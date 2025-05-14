const asyncHandler = require('express-async-handler');
const Direction = require('../models/directionModel');

// @desc    Create a new direction
// @route   POST /api/directions
// @access  Private/Admin
const createDirection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error('Please provide name and description');
  }

  // Check if direction already exists
  const directionExists = await Direction.findOne({ name });

  if (directionExists) {
    res.status(400);
    throw new Error('Direction already exists');
  }

  const direction = await Direction.create({
    name,
    description,
  });

  if (direction) {
    res.status(201).json(direction);
  } else {
    res.status(400);
    throw new Error('Invalid direction data');
  }
});

// @desc    Get all directions
// @route   GET /api/directions
// @access  Public
const getDirections = asyncHandler(async (req, res) => {
  const directions = await Direction.find({});
  res.json(directions);
});

// @desc    Get direction by ID
// @route   GET /api/directions/:id
// @access  Public
const getDirectionById = asyncHandler(async (req, res) => {
  const direction = await Direction.findById(req.params.id);

  if (direction) {
    res.json(direction);
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

// @desc    Update direction
// @route   PUT /api/directions/:id
// @access  Private/Admin
const updateDirection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const direction = await Direction.findById(req.params.id);

  if (direction) {
    direction.name = name || direction.name;
    direction.description = description || direction.description;

    const updatedDirection = await direction.save();
    res.json(updatedDirection);
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

// @desc    Delete direction
// @route   DELETE /api/directions/:id
// @access  Private/Admin
const deleteDirection = asyncHandler(async (req, res) => {
  const direction = await Direction.findById(req.params.id);

  if (direction) {
    await direction.deleteOne();
    res.json({ message: 'Direction removed' });
  } else {
    res.status(404);
    throw new Error('Direction not found');
  }
});

module.exports = {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
};
