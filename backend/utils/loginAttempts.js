/**
 * Login Attempt Tracking with Exponential Backoff
 * Prevents brute force attacks by implementing lockout periods that increase exponentially
 */

// In-memory storage for login attempts (use Redis in production for persistence)
const loginAttempts = new Map();

const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_TIME = 60 * 1000; // 60 seconds in milliseconds

/**
 * Get attempt data for an IP address
 * @param {string} ip - Client IP address
 * @returns {Object} Attempt data
 */
const getAttemptData = (ip) => {
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, {
      attempts: 0,
      lastAttempt: null,
      lockoutUntil: null,
      lockoutCount: 0 // Number of times this IP has been locked out
    });
  }
  return loginAttempts.get(ip);
};

/**
 * Calculate exponential lockout time based on previous lockouts
 * @param {number} lockoutCount - Number of previous lockouts
 * @returns {number} Lockout time in milliseconds
 */
const calculateLockoutTime = (lockoutCount) => {
  // Exponential backoff: 60s, 120s, 240s, 480s, 960s, etc.
  return BASE_LOCKOUT_TIME * Math.pow(2, lockoutCount);
};

/**
 * Check if IP is currently locked out
 * @param {string} ip - Client IP address
 * @returns {Object} { isLocked: boolean, remainingTime: number|null }
 */
const isLockedOut = (ip) => {
  const data = getAttemptData(ip);
  
  if (!data.lockoutUntil) {
    return { isLocked: false, remainingTime: null };
  }
  
  const now = Date.now();
  if (now < data.lockoutUntil) {
    const remainingTime = Math.ceil((data.lockoutUntil - now) / 1000); // in seconds
    return { isLocked: true, remainingTime };
  }
  
  // Lockout period expired, reset attempts
  data.attempts = 0;
  data.lockoutUntil = null;
  return { isLocked: false, remainingTime: null };
};

/**
 * Record a failed login attempt
 * @param {string} ip - Client IP address
 * @param {string} email - Email attempted
 * @returns {Object} { isLocked: boolean, remainingTime: number|null, attemptsLeft: number }
 */
const recordFailedAttempt = (ip, email) => {
  const data = getAttemptData(ip);
  const now = Date.now();
  
  data.attempts += 1;
  data.lastAttempt = now;
  
  const logger = require('./logger');
  
  if (data.attempts >= MAX_ATTEMPTS) {
    // Lock out the IP with exponential backoff
    const lockoutTime = calculateLockoutTime(data.lockoutCount);
    data.lockoutUntil = now + lockoutTime;
    data.lockoutCount += 1;
    
    logger.warn('AUTH', 'IP locked out due to failed attempts', {
      ip,
      email,
      attempts: data.attempts,
      lockoutCount: data.lockoutCount,
      lockoutTimeSeconds: lockoutTime / 1000,
      lockoutUntil: new Date(data.lockoutUntil).toISOString()
    });
    
    return {
      isLocked: true,
      remainingTime: Math.ceil(lockoutTime / 1000),
      attemptsLeft: 0
    };
  }
  
  logger.warn('AUTH', 'Failed login attempt recorded', {
    ip,
    email,
    attempts: data.attempts,
    attemptsLeft: MAX_ATTEMPTS - data.attempts
  });
  
  return {
    isLocked: false,
    remainingTime: null,
    attemptsLeft: MAX_ATTEMPTS - data.attempts
  };
};

/**
 * Record a successful login attempt (resets attempts)
 * @param {string} ip - Client IP address
 * @param {string} email - Email that successfully logged in
 */
const recordSuccessfulAttempt = (ip, email) => {
  const data = getAttemptData(ip);
  const logger = require('./logger');
  
  if (data.attempts > 0) {
    logger.info('AUTH', 'Successful login - resetting failed attempts', {
      ip,
      email,
      previousAttempts: data.attempts
    });
  }
  
  // Reset attempts on successful login
  data.attempts = 0;
  data.lockoutUntil = null;
  // Note: We don't reset lockoutCount to maintain exponential increase pattern
};

/**
 * Clear all attempts for an IP (admin override)
 * @param {string} ip - Client IP address
 */
const clearAttempts = (ip) => {
  loginAttempts.delete(ip);
  const logger = require('./logger');
  logger.info('AUTH', 'Login attempts cleared for IP', { ip });
};

/**
 * Get statistics about all tracked IPs
 * @returns {Object} Statistics
 */
const getStats = () => {
  const stats = {
    totalIPs: loginAttempts.size,
    lockedIPs: 0,
    totalAttempts: 0
  };
  
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    stats.totalAttempts += data.attempts;
    if (data.lockoutUntil && now < data.lockoutUntil) {
      stats.lockedIPs += 1;
    }
  }
  
  return stats;
};

module.exports = {
  isLockedOut,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  clearAttempts,
  getStats,
  MAX_ATTEMPTS,
  BASE_LOCKOUT_TIME
};
