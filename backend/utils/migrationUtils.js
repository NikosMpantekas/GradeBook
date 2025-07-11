// REMOVED: Legacy school features migration utility
// This file has been completely removed as part of cleaning up the broken school function permission toggle system.
// All school permission/feature restriction logic has been eliminated.
// Features are now controlled by a new superadmin-only toggle system that will be implemented separately.

const logger = require('./logger');

// Placeholder for future migration utilities (non-permission related)
const placeholderMigration = async () => {
  logger.info('MIGRATION', 'No active migrations available');
  return { success: true, message: 'No migrations to run' };
};

module.exports = {
  placeholderMigration
};
