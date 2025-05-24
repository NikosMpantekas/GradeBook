import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import CreateUser from './CreateUser';
import { trackError } from '../../utils/errorHandler';
import axios from 'axios';
import { useSelector } from 'react-redux';

/**
 * Enhanced error boundary wrapper for the CreateUser component
 * This adds safety checks, particularly for the directions-related TypeError
 */
const CreateUserErrorWrapper = (props) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [directionsData, setDirectionsData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Pre-load directions data to ensure it's available
  useEffect(() => {
    const loadDirections = async () => {
      try {
        console.log('[CreateUserErrorWrapper] Pre-loading directions data to prevent errors');
        if (!currentUser || !currentUser.token) {
          console.warn('[CreateUserErrorWrapper] No auth token available');
          return;
        }
        
        const config = {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        };
        
        const { data } = await axios.get('/api/directions', config);
        
        // Ensure data is valid before setting it
        if (Array.isArray(data)) {
          setDirectionsData(data);
          console.log(`[CreateUserErrorWrapper] Successfully pre-loaded ${data.length} directions`);
        } else {
          console.warn('[CreateUserErrorWrapper] Directions API returned non-array data:', data);
          setDirectionsData([]);
        }
      } catch (error) {
        console.error('[CreateUserErrorWrapper] Error pre-loading directions:', error);
        trackError(error, 'CreateUserDirectionsPreload');
        setDirectionsData([]);
      } finally {
        setLoaded(true);
      }
    };
    
    loadDirections();
  }, [currentUser]);

  // Add instrumentation and error detection
  useEffect(() => {
    console.log('[CreateUserErrorWrapper] Component mounted - enhanced error detection active');
    
    try {
      // Check Redux store structure
      const reduxStore = window.__REDUX_DEVTOOLS_EXTENSION__ ? 
        window.__REDUX_DEVTOOLS_EXTENSION__.connect().getState() : 
        null;
      
      if (reduxStore) {
        console.log('[DEBUG] Redux store structure detected:', {
          hasUserSlice: !!reduxStore.users,
          hasDirectionSlice: !!reduxStore.direction,
          hasSchoolSlice: !!reduxStore.schools,
          userSliceKeys: reduxStore.users ? Object.keys(reduxStore.users) : [],
          directionSliceKeys: reduxStore.direction ? Object.keys(reduxStore.direction) : [],
          schoolSliceKeys: reduxStore.schools ? Object.keys(reduxStore.schools) : []
        });
      }
      
      // Safety patch for the window object to prevent the TypeError
      // This is a defensive approach to protect against the specific 'x(...) is undefined' error
      if (typeof window.x === 'undefined') {
        window.x = function safeX() {
          console.warn('[CreateUserErrorWrapper] Safe x() function called - intercepted potential error');
          return [];
        };
      }
      
      // Detect and report errors
      const errorListener = (event) => {
        if (event.error) {
          const errorMsg = event.error.message || 'Unknown error';
          console.log(`🔍 Error detected in CreateUser: ${errorMsg}`);
          
          // Provide extra context for specific types of errors
          if (errorMsg.includes('undefined') || errorMsg.includes('null')) {
            console.log('🔍 This appears to be a null/undefined reference error - likely related to directions data');
          }
          
          trackError(event.error, 'CreateUserComponent');
        }
      };
      
      window.addEventListener('error', errorListener);
      
      // Cleanup
      return () => {
        window.removeEventListener('error', errorListener);
      };
    } catch (error) {
      console.error('[CreateUserErrorWrapper] Error in setup:', error);
    }
  }, []);

  // For debugging - log helpful information about the loaded directions
  useEffect(() => {
    if (loaded) {
      console.log(`[CreateUserErrorWrapper] Directions data is ${directionsData.length > 0 ? 'available' : 'empty'}`);
      if (directionsData.length > 0) {
        console.log('[CreateUserErrorWrapper] First direction:', directionsData[0]);
      }
    }
  }, [loaded, directionsData]);

  // Create safer props with pre-validated directions data
  const safeProps = {
    ...props,
    // Inject our pre-loaded directions data through the component tree
    // Note: The CreateUser component will need to be modified to use this prop
    safeDirectionsData: directionsData
  };

  // Don't render the actual component until we've loaded our safety data
  if (!loaded) {
    return (
      <div>Loading user creation form...</div>
    );
  }

  return (
    <ErrorBoundary componentName="CreateUser">
      <CreateUser {...safeProps} />
    </ErrorBoundary>
  );
};

export default CreateUserErrorWrapper;
