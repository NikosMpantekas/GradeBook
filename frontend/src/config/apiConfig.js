/**
 * API Configuration
 * This file centralizes all API URL logic for consistent endpoint handling
 */

import { API_URL } from './appConfig';

// Normalize URL handling to avoid issues with slashes
const normalizeUrl = (baseUrl, path = '') => {
  // Remove trailing slash from base URL
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Ensure path starts with slash if not empty
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  
  return `${normalizedBase}${normalizedPath}`;
};

// Create API endpoint builders for each service
const createApiEndpoint = (servicePath) => {
  const basePath = normalizeUrl(API_URL, servicePath);
  
  // Return a function that builds complete endpoint URLs
  return (path = '') => normalizeUrl(basePath, path);
};

// Define endpoint builders for all services
export const authEndpoint = createApiEndpoint('/api/users');
export const schoolsEndpoint = createApiEndpoint('/api/schools');
export const classesEndpoint = createApiEndpoint('/api/classes');
export const usersEndpoint = createApiEndpoint('/api/users');
export const subjectsEndpoint = createApiEndpoint('/api/subjects');
export const gradesEndpoint = createApiEndpoint('/api/grades');
export const ratingsEndpoint = createApiEndpoint('/api/ratings');
export const notificationsEndpoint = createApiEndpoint('/api/notifications');
export const subscriptionsEndpoint = createApiEndpoint('/api/subscriptions');
export const eventsEndpoint = createApiEndpoint('/api/events');
export const directionsEndpoint = createApiEndpoint('/api/directions');
export const migrationsEndpoint = createApiEndpoint('/api/admin/migrations');

// Debug logging in development
if (process.env.NODE_ENV !== 'production') {
  console.log('API Configuration:');
  console.log(`Base API URL: ${API_URL}`);
  console.log(`Auth Endpoint: ${authEndpoint()}`);
  console.log(`Schools Endpoint: ${schoolsEndpoint()}`);
}

// Export base URL for direct access
export { API_URL };
