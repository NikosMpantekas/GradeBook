import { createNotification, reset } from '../../../features/notifications/notificationSlice';
import { toast } from 'react-toastify';

/**
 * NotificationService - Handles the logic for sending notifications
 * Includes validation and API interaction
 */
class NotificationService {
  /**
   * Validates notification form data
   * @param {Object} formData - Notification form data
   * @returns {Object} - Object containing validation errors or empty if valid
   */
  static validate(formData) {
    const errors = {};

    // Validate title - required & max 100 chars
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Validate message - required & max 1000 chars
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length > 1000) {
      errors.message = 'Message must be less than 1000 characters';
    }

    // Validate recipients - required if not sending to all
    if (!formData.sendToAll && (!formData.recipients || formData.recipients.length === 0)) {
      errors.recipients = 'Please select at least one recipient';
    }

    return errors;
  }

  /**
   * Prepare notification data for submission
   * @param {Object} formData - Notification form data
   * @param {Object} user - Current user
   * @returns {Object} - Prepared notification data
   */
  static prepareNotificationData(formData, user) {
    const notificationData = {
      title: formData.title.trim(),
      message: formData.message.trim(),
      isImportant: formData.isImportant,
      targetRole: formData.filterByRole,
    };

    // Add recipients if not sending to all
    if (!formData.sendToAll) {
      notificationData.recipients = formData.recipients;
    } else {
      notificationData.sendToAll = true;
    }

    // Handle push notification if enabled
    // Note: We preserve this logic for any existing push notification functionality
    if (user?.allowPushNotifications) {
      notificationData.sendPush = true;
    }

    return notificationData;
  }

  /**
   * Send a notification
   * @param {Function} dispatch - Redux dispatch function
   * @param {Object} formData - Notification form data
   * @param {Object} user - Current user
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @param {Function} onComplete - Completion callback (always called)
   */
  static sendNotification(dispatch, formData, user, onSuccess, onError, onComplete) {
    console.log('Preparing to send notification...');
    
    // Validate notification data
    const errors = this.validate(formData);
    
    if (Object.keys(errors).length === 0) {
      const notificationData = this.prepareNotificationData(formData, user);
      
      console.log('Sending notification with data:', notificationData);
      
      // First ensure any previous notification state is reset
      dispatch(reset());
      
      // Then dispatch the new notification
      dispatch(createNotification(notificationData))
        .unwrap()
        .then((result) => {
          console.log('Notification created successfully:', result);
          if (onSuccess) onSuccess(result);
        })
        .catch((error) => {
          console.error('Failed to create notification:', error);
          toast.error(`Failed to send notification: ${error.message || 'Unknown error'}`);
          if (onError) onError(error);
        })
        .finally(() => {
          if (onComplete) onComplete();
        });
        
      return { errors: {}, valid: true };
    }
    
    console.log('Notification validation failed with errors:', errors);
    return { errors, valid: false };
  }
}

export default NotificationService;
