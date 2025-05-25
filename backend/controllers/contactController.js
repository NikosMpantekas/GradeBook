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
    
    console.log('Updating message:', id, 'with data:', { status, read, adminReply });

    // ENHANCED FIX: First verify the message exists before attempting updates
    const existingMessage = await Contact.findById(id);
    if (!existingMessage) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Build update object with guaranteed defaults
    const updateData = {
      // Set defaults in case fields are missing
      read: read !== undefined ? read : true,
      replyRead: false
    };
    
    // Always update the status if provided
    if (status !== undefined) updateData.status = status;
    
    // CRITICAL FIX: If admin is replying OR setting status to replied, ensure proper reply data
    if ((adminReply !== undefined && adminReply.trim() !== '') || status === 'replied') {
      // Make sure we have a valid reply text - use existing reply if present or default message
      updateData.adminReply = adminReply || existingMessage.adminReply || 'Your message has been reviewed by admin. Thank you.';
      updateData.adminReplyDate = new Date();
      updateData.status = 'replied'; // Always set status to replied
      updateData.read = true;
      updateData.replyRead = false; // Reset replyRead for new reply
      
      console.log('Adding admin reply data:', { 
        replyText: updateData.adminReply.substring(0, 30) + '...',
        replyDate: updateData.adminReplyDate
      });
    }

    // CRITICAL FIX: Use save instead of findByIdAndUpdate to ensure middleware runs
    // and all properties are properly updated
    Object.keys(updateData).forEach(key => {
      existingMessage[key] = updateData[key];
    });

    // Save the updated message
    await existingMessage.save();

    // Reload to make sure we have the latest version
    const updatedMessage = await Contact.findById(id);

    console.log(`Message ${id} updated:`, {
      status: updatedMessage.status,
      hasReply: updatedMessage.adminReply ? true : false,
      replyText: updatedMessage.adminReply ? updatedMessage.adminReply.substring(0, 30) + '...' : 'No reply',
      replyDate: updatedMessage.adminReplyDate
    });

    res.status(200).json(updatedMessage);
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
    // CRITICAL FIX: First get ALL messages that might need fixing
    const allUserMessages = await Contact.find({
      user: req.user._id,
      schoolId: req.user.schoolId
    }).lean();
    
    console.log(`Found ${allUserMessages.length} messages for user ${req.user._id}`);
    
    // EMERGENCY FIX: Check for messages that need repair (status='replied' but no reply text)
    const messagesToFix = allUserMessages.filter(msg => 
      msg.status === 'replied' && (!msg.adminReply || msg.adminReply.trim() === '')
    );
    
    // Fix any broken messages before returning them
    if (messagesToFix.length > 0) {
      console.log(`⚠️ CRITICAL: Found ${messagesToFix.length} broken replies - fixing now...`);
      
      // Fix all broken messages
      await Promise.all(messagesToFix.map(async (msg) => {
        // Add default reply text and date if missing
        await Contact.findByIdAndUpdate(msg._id, {
          adminReply: 'Your message has been reviewed and replied to by admin. Thank you for your report.',
          adminReplyDate: msg.adminReplyDate || new Date(),
          replyRead: false // Reset to make sure user sees it
        });
        console.log(`Fixed broken reply for message: ${msg._id}`);
      }));
    }
    
    // Now get the freshly updated messages
    const messages = await Contact.find({
      user: req.user._id,
      schoolId: req.user.schoolId
    })
      .sort({ createdAt: -1 })
      .lean();
    
    // Detailed logging to help debug
    console.log(`Returning ${messages.length} messages with ${messages.filter(m => m.status === 'replied').length} replies`);
    messages.forEach((msg, idx) => {
      if (msg.status === 'replied') {
        console.log(`Message ${idx+1}: ${msg._id} - Replied: ${!!msg.adminReply}, Text length: ${msg.adminReply?.length || 0}`);
      }
    });
    
    // Mark replies as read
    const unreadReplies = messages.filter(msg => 
      msg.status === 'replied' && !msg.replyRead
    );
    
    if (unreadReplies.length > 0) {
      await Promise.all(unreadReplies.map(msg => 
        Contact.findByIdAndUpdate(msg._id, { replyRead: true })
      ));
    }
    
    // Send to frontend
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
