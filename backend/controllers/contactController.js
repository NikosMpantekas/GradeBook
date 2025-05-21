const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Contact = require('../models/contactModel');

// @desc    Send a contact message to admin
// @route   POST /api/contact
// @access  Private (requires authentication)
const sendContactMessage = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  
  // Validate input
  if (!subject || !message) {
    res.status(400);
    throw new Error('Please include both subject and message');
  }

  try {
    // Get the user's info to include with the message
    const user = req.user;
    
    // Create a new contact message in the database
    const contactMessage = await Contact.create({
      user: user._id,
      subject,
      message,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      status: 'new',
      read: false
    });
    
    if (!contactMessage) {
      res.status(400);
      throw new Error('Failed to save contact message');
    }
    
    // Log for server-side debugging
    console.log('Contact message saved to database:', {
      id: contactMessage._id,
      from: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      subject,
      message,
      timestamp: contactMessage.createdAt
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Your message has been saved. We will review it as soon as possible.'
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500);
    throw new Error('Failed to save message: ' + error.message);
  }
});

// @desc    Get all contact messages (for admin)
// @route   GET /api/contact
// @access  Private (admin only)
const getContactMessages = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view contact messages');
  }

  try {
    // Get all messages, newest first
    const messages = await Contact.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving contact messages:', error);
    res.status(500);
    throw new Error('Failed to retrieve messages: ' + error.message);
  }
});

// @desc    Mark a contact message as read
// @route   PUT /api/contact/:id
// @access  Private (admin only)
const updateContactMessage = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update contact messages');
  }

  try {
    const { id } = req.params;
    const { status, read } = req.body;

    // Find and update the message
    const message = await Contact.findByIdAndUpdate(
      id,
      { status, read },
      { new: true }
    );

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500);
    throw new Error('Failed to update message: ' + error.message);
  }
});

module.exports = {
  sendContactMessage,
  getContactMessages,
  updateContactMessage
};
