const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Contact = require('../models/contactModel');
const { enforceSchoolFilter } = require('../middleware/schoolIdMiddleware');
const nodemailer = require('nodemailer');

// Email service function for sending contact message replies
const sendContactReplyEmail = async ({ name, email, subject, replyBody, originalMessage }) => {
  // Create transporter for Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // false for port 587
    auth: {
      user: process.env.SMTP_USER, // Your Brevo account email
      pass: process.env.SMTP_PASS  // Your Brevo SMTP key
    }
  });

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">📚 GradeBook</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Your Educational Management System</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Response to Your Inquiry</h2>
        
        <p style="color: #555; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">
          Thank you for contacting the GradeBook Team. We have received your message and are responding to your inquiry. Please <strong>do not reply</strong> to this email.
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">📧 Your Original Message</h3>
          <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          <div style="color: #555; line-height: 1.6; white-space: pre-wrap; margin-top: 15px;">${originalMessage}</div>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="color: #2e7d32; margin-top: 0;">💬 Our Response</h3>
          <div style="color: #2e7d32; line-height: 1.6; white-space: pre-wrap;">${replyBody}</div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://gradebook.pro'}/contact" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            📝 Contact Us Again
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
          This email was sent by the GradeBook Team. If you have any further questions, please don't hesitate to contact us again by clicking the button above. <strong>Please do not reply to this email.</strong>
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"GradeBook Support" <${process.env.SMTP_FROM_EMAIL || 'mail@gradebook.pro'}>`,
    to: email,
    subject: `Regarding your request: ${subject}`,
    html: emailTemplate
  };

  await transporter.sendMail(mailOptions);
  console.log(`Contact reply email sent to ${email} for user ${name}`);
};

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
    // Superadmins can see all messages including public ones
    // Regular admins only see their own messages
    const filter = req.user.role === 'superadmin' 
      ? {} 
      : { user: req.user._id, schoolId: req.user.schoolId };
      
    // Get messages for this user/superadmin, newest first
    const messages = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // For superadmins, add a "Public" flag to public contact messages
    if (req.user.role === 'superadmin') {
      messages.forEach(message => {
        if (message.isPublicContact) {
          message.userRole = 'Public'; // Show "Public" as the role for public messages
        }
      });
    }
    
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
      
      // Send email for public contact messages
      if (existingMessage.isPublicContact && adminReply && adminReply.trim() !== '') {
        try {
          await sendContactReplyEmail({
            name: existingMessage.userName,
            email: existingMessage.userEmail,
            subject: existingMessage.subject,
            replyBody: adminReply,
            originalMessage: existingMessage.message // Pass the original message body
          });
          console.log(`Email sent to ${existingMessage.userEmail} for public contact message ${id}`);
        } catch (emailError) {
          console.error('Failed to send contact reply email:', emailError);
          // Don't fail the entire request if email fails
        }
      }
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

// MongoDB injection protection utilities
const sanitizeForMongoDB = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove MongoDB operators that could be used for injection
  const mongoOperators = [
    '$where', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$exists', 
    '$regex', '$text', '$search', '$or', '$and', '$not', '$nor', '$all', 
    '$elemMatch', '$size', '$type', '$mod', '$expr', '$jsonSchema', '$geoWithin',
    '$geoIntersects', '$near', '$nearSphere', '$maxDistance', '$minDistance'
  ];
  
  let sanitized = input;
  
  // Remove MongoDB operators
  mongoOperators.forEach(operator => {
    const regex = new RegExp(operator.replace('$', '\\$'), 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script tags and javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

// Input validation with MongoDB injection protection
const validateAndSanitizeInput = (data) => {
  const errors = [];
  const sanitized = {};
  
  // Validate and sanitize name
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else {
    const name = sanitizeForMongoDB(data.name);
    if (name.length < 1 || name.length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    } else if (!/^[a-zA-Zα-ωΑ-Ω\s]+$/.test(name)) {
      errors.push('Name can only contain letters and spaces');
    } else {
      sanitized.name = name;
    }
  }
  
  // Validate and sanitize email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else {
    const email = sanitizeForMongoDB(data.email.toLowerCase());
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      errors.push('Please provide a valid email address');
    } else {
      sanitized.email = email;
    }
  }
  
  // Validate and sanitize subject
  if (!data.subject || typeof data.subject !== 'string') {
    errors.push('Subject is required and must be a string');
  } else {
    const subject = sanitizeForMongoDB(data.subject);
    if (subject.length < 1 || subject.length > 200) {
      errors.push('Subject must be between 1 and 200 characters');
    } else {
      sanitized.subject = subject;
    }
  }
  
  // Validate and sanitize message
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else {
    const message = sanitizeForMongoDB(data.message);
    if (message.length < 1 || message.length > 2000) {
      errors.push('Message must be between 1 and 2000 characters');
    } else {
      sanitized.message = message;
    }
  }
  
  return { errors, sanitized };
};

// Rate limiting for public contact messages
const rateLimitMap = new Map();

const checkRateLimit = (ip, email) => {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 3;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const attempts = rateLimitMap.get(key);
  
  // Remove old attempts
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  rateLimitMap.set(key, validAttempts);
  
  if (validAttempts.length >= maxAttempts) {
    return false;
  }
  
  validAttempts.push(now);
  return true;
};

// @desc    Send a public contact message (no authentication required)
// @route   POST /api/contact/public
// @access  Public
const sendPublicContactMessage = asyncHandler(async (req, res) => {
  try {
    // Rate limiting check
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const email = req.body.email;
    
    if (!checkRateLimit(clientIP, email)) {
      res.status(429);
      throw new Error('Too many attempts. Please wait before trying again.');
    }
    
    // Validate and sanitize input
    const { errors, sanitized } = validateAndSanitizeInput(req.body);
    
    if (errors.length > 0) {
      res.status(400);
      throw new Error(errors.join(', '));
    }
    
    // Create a new contact message with sanitized data
    const contactMessage = await Contact.create({
      userName: sanitized.name,
      userEmail: sanitized.email,
      subject: sanitized.subject,
      message: sanitized.message,
      status: 'new',
      read: false,
      isBugReport: false,
      adminReply: '',
      adminReplyDate: null,
      replyRead: false,
      isPublicContact: true,
      // Additional security fields
      clientIP: clientIP,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || '',
      timestamp: new Date(),
    });
    
    if (!contactMessage) {
      res.status(400);
      throw new Error('Failed to save contact message');
    }
    
    // Log for server-side debugging (sanitized)
    console.log('Public contact message saved to database:', {
      id: contactMessage._id,
      from: {
        name: sanitized.name,
        email: sanitized.email
      },
      subject: sanitized.subject,
      messageLength: sanitized.message.length,
      timestamp: contactMessage.createdAt,
      clientIP: clientIP
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Your message has been sent successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error saving public contact message:', error);
    res.status(500);
    throw new Error('Failed to save message: ' + error.message);
  }
});

module.exports = {
  sendContactMessage,
  getContactMessages,
  updateContactMessage,
  getUserMessages,
  markReplyAsRead,
  sendPublicContactMessage
};
