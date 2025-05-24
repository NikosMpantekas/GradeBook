const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Contact = require('../models/contactModel');
const { enforceSchoolFilter } = require('../middleware/schoolIdMiddleware');

// @desc    Send a contact message to admin
// @route   POST /api/contact
// @access  Private (requires authentication)
const sendContactMessage = asyncHandler(async (req, res) => {
  const { subject, message, isBugReport = false } = req.body;
  
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
      schoolId: user.schoolId, // Add schoolId for multi-tenancy
      subject,
      message,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      status: 'new',
      read: false,
      isBugReport: isBugReport, // Flag to identify bug reports specifically
      adminReply: '',
      adminReplyDate: null,
      replyRead: false
    });
    
    if (!contactMessage) {
      res.status(400);
      throw new Error('Failed to save contact message');
    }
    
    // Log for server-side debugging
    console.log(`${isBugReport ? 'Bug report' : 'Contact message'} saved to database:`, {
      id: contactMessage._id,
      from: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      subject,
      message,
      isBugReport,
      timestamp: contactMessage.createdAt
    });
    
    res.status(201).json({ 
      success: true, 
      message: isBugReport 
        ? 'Your bug report has been saved. We will investigate the issue as soon as possible.' 
        : 'Your message has been saved. We will review it as soon as possible.'
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
  // Check if user is admin or superadmin
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to view contact messages');
  }

  try {
    // For admin users, filter messages by their schoolId (multi-tenancy)
    // Superadmins can see all messages across schools
    const filter = req.user.role === 'superadmin' 
      ? {} 
      : { schoolId: req.user.schoolId };
      
    // Get all messages for this school, newest first
    const messages = await Contact.find(filter)
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
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to update contact messages');
  }

  try {
    const { id } = req.params;
    const { status, read, adminReply } = req.body;

    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (read !== undefined) updateData.read = read;
    
    // If admin is replying, add the reply details
    if (adminReply !== undefined && adminReply.trim() !== '') {
      updateData.adminReply = adminReply;
      updateData.adminReplyDate = new Date();
      updateData.status = 'replied';
      updateData.read = true;
      updateData.replyRead = false; // Reset replyRead since there's a new reply
    }

    // Find and update the message
    const message = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    console.log(`Message ${id} updated:`, {
      status: message.status,
      hasReply: message.adminReply ? true : false,
      replyDate: message.adminReplyDate
    });

    res.status(200).json(message);
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500);
    throw new Error('Failed to update message: ' + error.message);
  }
});

// @desc    Get user's own contact messages including those with admin replies
// @route   GET /api/contact/user
// @access  Private (any authenticated user)
const getUserMessages = asyncHandler(async (req, res) => {
  try {
    // Get all messages for this user, newest first
    // Include schoolId in the filter for multi-tenancy
    const messages = await Contact.find({
      user: req.user._id,
      schoolId: req.user.schoolId
    })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Retrieved ${messages.length} messages for user ${req.user._id}`);
    
    // Mark any unread replies as read
    const unreadReplies = messages.filter(msg => 
      msg.adminReply && msg.adminReply.trim() !== '' && !msg.replyRead
    );
    
    if (unreadReplies.length > 0) {
      console.log(`Marking ${unreadReplies.length} replies as read`);
      
      // Update all unread messages to be read
      await Promise.all(unreadReplies.map(msg => 
        Contact.findByIdAndUpdate(msg._id, { replyRead: true })
      ));
    }
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving user messages:', error);
    res.status(500);
    throw new Error('Failed to retrieve your messages: ' + error.message);
  }
});

// @desc    Mark a message reply as read by the user
// @route   PUT /api/contact/user/:id/read
// @access  Private (message owner only)
const markReplyAsRead = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the message and ensure it belongs to this user and school
    // Include schoolId in the filter for multi-tenancy
    const message = await Contact.findOne({
      _id: id,
      user: req.user._id,
      schoolId: req.user.schoolId
    });
    
    if (!message) {
      res.status(404);
      throw new Error('Message not found or you do not have permission to access it');
    }
    
    // Mark the reply as read
    message.replyRead = true;
    await message.save();
    
    res.status(200).json({ success: true, message: 'Reply marked as read' });
  } catch (error) {
    console.error('Error marking reply as read:', error);
    res.status(500);
    throw new Error('Failed to update message: ' + error.message);
  }
});

module.exports = {
  sendContactMessage,
  getContactMessages,
  updateContactMessage,
  getUserMessages,
  markReplyAsRead
};
