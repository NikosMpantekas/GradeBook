import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../config/appConfig';

// Create the context
const FeatureToggleContext = createContext();

// Default state for features - everything disabled by default for safety
const defaultFeatures = {
  enableGrades: false,
  enableClasses: false,
  enableSubjects: false,
  enableStudents: false,
  enableTeachers: false,
  enableNotifications: false,
  enableContactDeveloper: false,
  enableCalendar: false,
  enableSchedule: false,
  enableRatingSystem: false,
  enableAnalytics: false,
  enableUserManagement: false,
  enableSchoolSettings: false,
  enableSystemMaintenance: false,
  enableBugReports: false,
  enableDirections: false,
  enablePatchNotes: false,
  enableStudentProgress: false
};

/**
 * Provider component for feature toggle functionality
 * This will fetch feature toggles from the new comprehensive permission system
 */
export const FeatureToggleProvider = ({ children }) => {
  // Get auth state from Redux store
  const { user, token } = useSelector((state) => state.auth);
  const [features, setFeatures] = useState(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feature toggles from the new permission system
  useEffect(() => {
    console.log('FeatureToggleProvider: Auth state changed', { user: user?.email, hasToken: !!token });
    
    // If no user or no token, reset features to default (disabled)
    if (!user || !token) {
      console.log('FeatureToggleProvider: No user or token, resetting to default features');
      setFeatures(defaultFeatures);
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch feature toggles from the new permission system
    const fetchFeatureToggles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('FeatureToggleProvider: Fetching permissions from new system');

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        // Use the new API endpoint for current user's school permissions
        const response = await axios.get(`${API_URL}/api/school-permissions/current`, config);
        
        console.log('FeatureToggleProvider: Permission response:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          const { features: fetchedFeatures, isSuperAdmin } = response.data.data;
          
          setFeatures(fetchedFeatures || defaultFeatures);
          
          console.log('========== FEATURE TOGGLE DEBUG ==========');
          console.log('FeatureToggleProvider: Raw API response:', response.data);
          console.log('FeatureToggleProvider: Extracted features:', fetchedFeatures);
          console.log('FeatureToggleProvider: isSuperAdmin:', isSuperAdmin);
          console.log('FeatureToggleProvider: Features count:', Object.keys(fetchedFeatures || {}).length);
          
          // Check specific admin features that should be visible
          const expectedFeatures = [
            'enableUserManagement',
            'enableClasses', 
            'enableGrades',
            'enableNotifications',
            'enableSchedule',
            'enableSchoolSettings'
          ];
          
          console.log('Expected admin features status:');
          expectedFeatures.forEach(feature => {
            const isEnabled = fetchedFeatures && fetchedFeatures[feature] === true;
            console.log(`  ${feature}: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED/MISSING'}`);
          });
          console.log('========== END FEATURE DEBUG ==========');
          
          console.log('FeatureToggleProvider: Features loaded successfully', {
            isSuperAdmin,
            featuresCount: Object.keys(fetchedFeatures || {}).length
          });
          
        } else {
          console.error('FeatureToggleProvider: Invalid response structure');
          setError('Invalid response from permission system');
          setFeatures(defaultFeatures);
        }
        
      } catch (error) {
        console.error('FeatureToggleProvider: Error fetching feature toggles:', error);
        
        // More detailed error logging
        if (error.response) {
          console.error('FeatureToggleProvider: Error response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || error.message}`);
        } else if (error.request) {
          console.error('FeatureToggleProvider: No response received:', error.request);
          setError('No response from server');
        } else {
          console.error('FeatureToggleProvider: Request setup error:', error.message);
          setError(`Request error: ${error.message}`);
        }
        
        // Fallback to default features on error
        setFeatures(defaultFeatures);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureToggles();
  }, [user, token]);

  // Helper function to check if a specific feature is enabled
  const isFeatureEnabled = (featureName) => {
    // For superadmin, all features are enabled by default
    if (user?.role === 'superadmin') {
      return true;
    }
    
    // Check if the feature exists in the loaded features
    if (features && featureName in features) {
      const isEnabled = features[featureName] === true;
      console.log(`[FEATURE TOGGLE] Feature '${featureName}' for ${user?.role}: ${isEnabled}`);
      return isEnabled;
    }
    
    // Default to false for safety
    console.warn(`FeatureToggleProvider: Feature '${featureName}' not found in features object`);
    return false;
  };

  // Helper function to get all enabled features
  const getEnabledFeatures = () => {
    if (user?.role === 'superadmin') {
      // Return all features as enabled for superadmin
      const allFeatures = {};
      Object.keys(defaultFeatures).forEach(key => {
        allFeatures[key] = true;
      });
      return allFeatures;
    }
    
    // Filter only enabled features for all other users (including admin)
    const enabledFeatures = {};
    Object.keys(features).forEach(key => {
      if (features[key] === true) {
        enabledFeatures[key] = true;
      }
    });
    
    console.log(`[FEATURE TOGGLE] Enabled features for ${user?.role}:`, enabledFeatures);
    return enabledFeatures;
  };

  // Helper function to refresh permissions (useful after updates)
  const refreshPermissions = async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${API_URL}/api/school-permissions/current`, config);
      
      if (response.data && response.data.success && response.data.data) {
        const { features: fetchedFeatures } = response.data.data;
        setFeatures(fetchedFeatures || defaultFeatures);
        console.log('FeatureToggleProvider: Permissions refreshed successfully');
      }
      
    } catch (error) {
      console.error('FeatureToggleProvider: Error refreshing permissions:', error);
      setError('Failed to refresh permissions');
    } finally {
      setLoading(false);
    }
  };

  // Expose the context value
  const contextValue = {
    features,
    loading,
    error,
    isFeatureEnabled,
    getEnabledFeatures,
    refreshPermissions,
    isSuperAdmin: user?.role === 'superadmin'
  };

  return (
    <FeatureToggleContext.Provider value={contextValue}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

/**
 * Custom hook to use the feature toggle context
 */
export const useFeatureToggles = () => {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggles must be used within a FeatureToggleProvider');
  }
  return context;
};

export default FeatureToggleContext;
