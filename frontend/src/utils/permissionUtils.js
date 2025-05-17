/**
 * Utilities for managing user permissions across the application
 * This provides a centralized way to update permissions and ensure they
 * take effect immediately without requiring users to log out and log back in
 */
import apiClient from '../config/apiClient';
import { store } from '../store';
import { updatePermissions } from '../features/auth/authSlice';
import { toast } from 'react-toastify';

/**
 * Updates a user's permissions and ensures changes take effect immediately
 * across the application, including for the currently logged-in user
 * 
 * @param {string} userId - The ID of the user whose permissions are being updated
 * @param {Object} permissions - The permissions object containing updated values
 * @param {Function} [callback] - Optional callback to execute after successful update
 * @returns {Promise} - A promise that resolves with the API response or rejects with error
 */
export const updateUserPermissions = async (userId, permissions, callback) => {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!permissions || Object.keys(permissions).length === 0) {
      throw new Error('No permission updates provided');
    }
    
    // Get the current logged-in user from Redux store
    const { auth } = store.getState();
    const currentUser = auth.user;
    
    console.log(`Updating permissions for user ${userId}:`, permissions);
    
    // Call the API endpoint to update permissions
    const response = await apiClient.patch(`/users/${userId}/permissions`, permissions);
    
    // If the update was successful
    if (response.status === 200) {
      // If this is the current logged-in user, update Redux store to trigger immediate
      // permission changes without requiring logout/login
      if (currentUser && currentUser._id === userId) {
        console.log('Updating current user permissions in application state');
        store.dispatch(updatePermissions({
          userId,
          permissions
        }));
        
        // Show success message
        toast.success('Your permissions have been updated');
      } else {
        // Show success for other users
        toast.success('User permissions updated successfully');
      }
      
      // Call the callback if provided
      if (typeof callback === 'function') {
        callback(response.data);
      }
      
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating user permissions:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update permissions';
    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Checks if a user has a specific permission
 * 
 * @param {Object} user - The user object to check
 * @param {string} permission - The permission key to check
 * @returns {boolean} - Whether the user has the specified permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  switch (permission) {
    case 'sendNotifications':
      return user.role === 'admin' || user.role === 'school_owner' || 
             (user.role === 'teacher' && user.canSendNotifications === true);
      
    case 'addGradeDescriptions':
      return user.role === 'admin' || user.role === 'school_owner' || 
             (user.role === 'teacher' && user.canAddGradeDescriptions === true);
      
    // Add other permission checks as needed
      
    default:
      return false;
  }
};

export default {
  updateUserPermissions,
  hasPermission
};
