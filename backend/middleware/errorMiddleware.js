const logger = require('../utils/logger');

/**
 * Not Found Error Handler - When a route is not found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  
  // Log the 404 error with request details
  logger.warn('SERVER', `404 Not Found: ${req.originalUrl}`, {
    method: req.method,
    ip: req.ip,
    headers: req.headers,
    path: req.path,
    params: req.params,
    query: req.query
  });
  
  res.status(404);
  next(error);
};

/**
 * Global Error Handler - Catches all unhandled errors
 */
const errorHandler = (err, req, res, next) => {
  // If status code is 200, set it to 500 (server error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
  
  // Set status code on response
  res.status(statusCode);
  
  // Log detailed error information
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const category = 'SERVER';
  const message = `${statusCode} Error: ${err.message}`;
  
  // Additional contextual data for debugging
  const logData = {
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
    userRole: req.user?.role,
    requestBody: statusCode !== 401 ? req.body : '[REDACTED]', // Don't log credentials
    errorName: err.name,
    stack: err.stack
  };
  
  // If authentication related, log additional details
  if (req.path.includes('/login') || req.path.includes('/auth') || statusCode === 401) {
    logger.warn('AUTH', `Authentication error: ${err.message}`, logData);
  }
  
  // If superadmin related, add special logging
  if (req.path.includes('/superadmin')) {
    logger.error('SUPERADMIN', `Error in superadmin route: ${err.message}`, logData);
  }
  
  // Log the error with appropriate level
  logger[logLevel](category, message, logData);
  
  // Send response to client
  res.json({
    message: err.message,
    // Only include stack trace in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    // Include a request ID for correlation in logs
    requestId: req.id || Math.random().toString(36).substring(2, 15)
  });
};

module.exports = { errorHandler, notFound };
