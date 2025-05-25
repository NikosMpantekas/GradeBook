const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (role-based permissions checked in controller)
const createEvent = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      audience,
      color,
      tags
    } = req.body;

    // Validate required fields
    if (!title) {
      res.status(400);
      throw new Error('Please add a title');
    }

    if (!startDate) {
      res.status(400);
      throw new Error('Please specify the event date');
    }

    // Create event with current user as creator
    const eventData = {
      title,
      description: description || '',
      startDate,
      endDate: endDate || startDate, // Default to startDate if endDate not provided
      allDay: allDay !== undefined ? allDay : true,
      creator: req.user._id,
      creatorRole: req.user.role,
      schoolId: req.user.schoolId || null, // Handle superadmin case
      audience: {
        targetType: audience?.targetType || 'specific',
        specificUsers: audience?.specificUsers || [],
        schools: audience?.schools || [],
        directions: audience?.directions || []
      },
      color: color || '#1976d2',
      tags: tags || [],
      isActive: true
    };

    // Validate audience settings based on user role
    if (req.user.role === 'superadmin') {
      // Superadmin can create events for any audience
      if (!['all', 'admins', 'teachers', 'students', 'specific'].includes(eventData.audience.targetType)) {
        eventData.audience.targetType = 'all'; // Default to all users
      }
    } else if (req.user.role === 'admin' || req.user.role === 'secretary') {
      // Admin and secretary can create events for teachers and students
      if (!['teachers', 'students', 'specific'].includes(eventData.audience.targetType)) {
        eventData.audience.targetType = 'teachers'; // Default to teachers
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can only create events for students
      if (!['students', 'specific'].includes(eventData.audience.targetType)) {
        eventData.audience.targetType = 'students'; // Default to students
      }
    } else {
      // Students cannot create events
      res.status(403);
      throw new Error('You do not have permission to create events');
    }

    // Create the event
    const event = await Event.create(eventData);

    // Log the event creation
    logger.info('EVENT', `Event created: ${title}`, {
      id: event._id,
      creator: req.user._id,
      creatorRole: req.user.role,
      audience: eventData.audience.targetType
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error creating event');
  }
});

// @desc    Get all events for a user (filtered by permissions)
// @route   GET /api/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  try {
    // Get query parameters for filtering
    const { startDate, endDate, tags } = req.query;
    
    // Base query
    const query = { isActive: true };
    
    // Date range filtering
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }
    
    // Tags filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Role-based access control for events
    const userId = req.user._id;
    const userRole = req.user.role;
    const userSchoolId = req.user.schoolId;

    // Build audience criteria based on user role
    let audienceCriteria = [];
    
    // All users can see events where they are specifically targeted
    audienceCriteria.push({ 'audience.specificUsers': userId });
    
    if (userRole === 'superadmin') {
      // Superadmins can see all events
      audienceCriteria.push({}); // Empty criteria means all events
    } else if (userRole === 'admin') {
      // Admins can see events targeted to all, admins, and events for their school
      audienceCriteria.push({ 'audience.targetType': 'all' });
      audienceCriteria.push({ 'audience.targetType': 'admins' });
      audienceCriteria.push({ 
        'audience.targetType': 'specific',
        'audience.schools': userSchoolId
      });
    } else if (userRole === 'secretary') {
      // Secretaries can see events targeted to all, admins, and events for their school
      audienceCriteria.push({ 'audience.targetType': 'all' });
      audienceCriteria.push({ 'audience.targetType': 'admins' });
      audienceCriteria.push({ 
        'audience.targetType': 'specific',
        'audience.schools': userSchoolId
      });
    } else if (userRole === 'teacher') {
      // Teachers can see events for all, teachers, and events for their school/directions
      audienceCriteria.push({ 'audience.targetType': 'all' });
      audienceCriteria.push({ 'audience.targetType': 'teachers' });
      
      // Add school and direction criteria if they exist
      if (req.user.schools && req.user.schools.length > 0) {
        audienceCriteria.push({ 
          'audience.targetType': 'specific',
          'audience.schools': { $in: req.user.schools }
        });
      }
      
      if (req.user.directions && req.user.directions.length > 0) {
        audienceCriteria.push({ 
          'audience.targetType': 'specific',
          'audience.directions': { $in: req.user.directions }
        });
      }
    } else if (userRole === 'student') {
      // Students can see events for all, students, and events for their school/direction
      audienceCriteria.push({ 'audience.targetType': 'all' });
      audienceCriteria.push({ 'audience.targetType': 'students' });
      
      // Add school criteria if it exists
      if (req.user.school) {
        audienceCriteria.push({ 
          'audience.targetType': 'specific',
          'audience.schools': req.user.school
        });
      }
      
      // Add direction criteria if it exists
      if (req.user.direction) {
        audienceCriteria.push({ 
          'audience.targetType': 'specific',
          'audience.directions': req.user.direction
        });
      }
    }
    
    // Combine the base query with the audience criteria
    const finalQuery = {
      ...query,
      $or: audienceCriteria
    };
    
    // Execute the query with populated fields
    const events = await Event.find(finalQuery)
      .populate('creator', 'name')
      .sort({ startDate: 1 })
      .lean();
    
    // Log the query result
    logger.info('EVENT', `Retrieved ${events.length} events for user`, {
      userId,
      userRole,
      filters: {
        dateRange: startDate && endDate ? true : false,
        tags: tags ? true : false
      }
    });
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving events');
  }
});

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Private
const getEventById = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name')
      .populate('audience.specificUsers', 'name')
      .populate('audience.schools', 'name')
      .populate('audience.directions', 'name');
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    
    // Check if user has permission to view this event
    const canView = await userCanAccessEvent(req.user, event);
    
    if (!canView) {
      res.status(403);
      throw new Error('You do not have permission to view this event');
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Error getting event by ID:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving event');
  }
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    
    // Check if user has permission to update this event
    const canUpdate = 
      req.user.role === 'superadmin' || 
      event.creator.toString() === req.user._id.toString() || 
      (req.user.role === 'admin' && req.user.schoolId.toString() === event.schoolId.toString());
    
    if (!canUpdate) {
      res.status(403);
      throw new Error('You do not have permission to update this event');
    }
    
    // Update the event fields
    if (req.body.title) event.title = req.body.title;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.startDate) event.startDate = req.body.startDate;
    if (req.body.endDate) event.endDate = req.body.endDate;
    if (req.body.allDay !== undefined) event.allDay = req.body.allDay;
    if (req.body.color) event.color = req.body.color;
    if (req.body.tags) event.tags = req.body.tags;
    
    // Update audience if provided
    if (req.body.audience) {
      // Check if the user has permission to set this audience type
      const canSetAudience = await validateAudiencePermission(req.user, req.body.audience.targetType);
      
      if (!canSetAudience) {
        res.status(403);
        throw new Error('You do not have permission to set this audience type');
      }
      
      // Update audience fields
      if (req.body.audience.targetType) event.audience.targetType = req.body.audience.targetType;
      if (req.body.audience.specificUsers) event.audience.specificUsers = req.body.audience.specificUsers;
      if (req.body.audience.schools) event.audience.schools = req.body.audience.schools;
      if (req.body.audience.directions) event.audience.directions = req.body.audience.directions;
    }
    
    // Save the updated event
    const updatedEvent = await event.save();
    
    // Log the update
    logger.info('EVENT', `Event updated: ${updatedEvent.title}`, {
      id: updatedEvent._id,
      updatedBy: req.user._id,
      updaterRole: req.user.role
    });
    
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error updating event');
  }
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    
    // Check if user has permission to delete this event
    const canDelete = 
      req.user.role === 'superadmin' || 
      event.creator.toString() === req.user._id.toString() || 
      (req.user.role === 'admin' && req.user.schoolId.toString() === event.schoolId.toString());
    
    if (!canDelete) {
      res.status(403);
      throw new Error('You do not have permission to delete this event');
    }
    
    // Soft delete by setting isActive to false
    event.isActive = false;
    await event.save();
    
    // Log the deletion
    logger.info('EVENT', `Event deleted: ${event.title}`, {
      id: event._id,
      deletedBy: req.user._id,
      deleterRole: req.user.role
    });
    
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error deleting event');
  }
});

// Helper functions

// Check if a user can access an event
async function userCanAccessEvent(user, event) {
  // Superadmins can access all events
  if (user.role === 'superadmin') return true;
  
  // Event creator can always access their own events
  if (event.creator.toString() === user._id.toString()) return true;
  
  // Check target audience type
  if (event.audience.targetType === 'all') return true;
  
  if (event.audience.targetType === 'admins' && 
     (user.role === 'admin' || user.role === 'secretary')) return true;
  
  if (event.audience.targetType === 'teachers' && user.role === 'teacher') return true;
  
  if (event.audience.targetType === 'students' && user.role === 'student') return true;
  
  // Check specific user targeting
  if (event.audience.specificUsers.some(id => id.toString() === user._id.toString())) return true;
  
  // Check school targeting
  const userSchoolIds = [];
  if (user.schoolId) userSchoolIds.push(user.schoolId.toString());
  if (user.school) userSchoolIds.push(user.school.toString());
  if (user.schools && user.schools.length > 0) {
    user.schools.forEach(school => userSchoolIds.push(school.toString()));
  }
  
  if (userSchoolIds.length > 0 && 
      event.audience.schools.some(schoolId => userSchoolIds.includes(schoolId.toString()))) {
    return true;
  }
  
  // Check direction targeting
  const userDirectionIds = [];
  if (user.direction) userDirectionIds.push(user.direction.toString());
  if (user.directions && user.directions.length > 0) {
    user.directions.forEach(direction => userDirectionIds.push(direction.toString()));
  }
  
  if (userDirectionIds.length > 0 && 
      event.audience.directions.some(directionId => userDirectionIds.includes(directionId.toString()))) {
    return true;
  }
  
  // If no access criteria matched, deny access
  return false;
}

// Validate if a user can set a specific audience type
async function validateAudiencePermission(user, targetType) {
  if (user.role === 'superadmin') {
    // Superadmin can set any audience type
    return true;
  } else if (user.role === 'admin' || user.role === 'secretary') {
    // Admins and secretaries can set teachers, students, or specific
    return ['teachers', 'students', 'specific'].includes(targetType);
  } else if (user.role === 'teacher') {
    // Teachers can only set students or specific
    return ['students', 'specific'].includes(targetType);
  } else {
    // Students cannot set any audience type
    return false;
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
