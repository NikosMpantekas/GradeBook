/**
 * Application configuration
 * Contains global settings and version information
 */

export const APP_VERSION = '1.3.16';

// API URL - adjust for production environment if needed
export const API_URL = process.env.REACT_APP_API_URL || '/api';

// Multi-tenant configuration
export const MULTI_TENANT_CONFIG = {
  // Whether multi-tenant mode is active
  enabled: true,
  
  // Default tenant for users without explicit tenant
  defaultTenant: 'main',
  
  // If true, allows users to sign in with tenant-specific email domains (e.g., user@tenant.gradebook.com)
  domainBasedRouting: true,
  
  // Domain suffix used for tenant identification (if domainBasedRouting is true)
  tenantDomainSuffix: '.tenant.gradebook.com',
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
  TENANT: 'tenant',
};

// Role definitions
export const USER_ROLES = {
  SUPER_ADMIN: 'superadmin',
  SCHOOL_OWNER: 'school_owner',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};