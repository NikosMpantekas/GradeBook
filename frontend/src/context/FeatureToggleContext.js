import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../config/appConfig';

// Create the context
const FeatureToggleContext = createContext();

// Default state for features - everything disabled by default
const defaultFeatures = {
  enableCalendar: false,
  enableRatingSystem: false,
  enableGrades: false,
  enableNotifications: false
};

/**
 * Provider component for feature toggle functionality
 * This will fetch feature toggles from the backend based on the user's school
 */
export const FeatureToggleProvider = ({ children }) => {
  // Get auth state from Redux store
  const { user, token } = useSelector((state) => state.auth);
  const [features, setFeatures] = useState(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For super admin, enable all features by default
  useEffect(() => {
    if (user?.role === 'superadmin') {
      setFeatures({
        enableCalendar: true,
        enableRatingSystem: true,
        enableGrades: true,
        enableNotifications: true
      });
      setLoading(false);
      return;
    }

    // If no user or no token, reset features to default (disabled)
    if (!user || !token) {
      setFeatures(defaultFeatures);
      setLoading(false);
      return;
    }

    // Fetch feature toggles from the backend
    const fetchFeatureToggles = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Use a dedicated API endpoint to get feature toggles
        const response = await axios.get(`${API_URL}/api/schools/features`, config);
        
        if (response.data && response.data.features) {
          // Always force enable grades and notifications regardless of API response
          setFeatures({
            ...response.data.features,
            enableGrades: true,
            enableNotifications: true
          });
        } else {
          // Force enable features even in fallback case
          setFeatures({
            ...defaultFeatures,
            enableGrades: true,
            enableNotifications: true
          });
        }
      } catch (error) {
        console.error('Error fetching feature toggles:', error);
        setError(error.message || 'Failed to load feature toggles');
        // Fallback to default features on error but force enable grades and notifications
        setFeatures({
          ...defaultFeatures,
          enableGrades: true,
          enableNotifications: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureToggles();
  }, [user, token]);

  // Expose the context value
  const contextValue = {
    features,
    loading,
    error,
    // Helper functions to check if specific features are enabled
    isCalendarEnabled: features.enableCalendar === true,
    isRatingSystemEnabled: features.enableRatingSystem === true,
    isGradesEnabled: features.enableGrades === true,
    isNotificationsEnabled: features.enableNotifications === true
  };

  return (
    <FeatureToggleContext.Provider value={contextValue}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

// Custom hook to use the feature toggle context
export const useFeatureToggles = () => {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggles must be used within a FeatureToggleProvider');
  }
  return context;
};

export default FeatureToggleContext;
