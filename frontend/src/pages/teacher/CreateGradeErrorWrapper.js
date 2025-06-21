import React from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
// CRITICAL FIX: Use the simplified version that avoids the Redux patterns causing errors
import CreateGradeSimple from './CreateGradeSimple';
import { handleAxiosError } from './CreateGradeUtils';
import { trackError } from '../../utils/errorHandler';

/**
 * Special error boundary wrapper for the CreateGrade component
 * This now uses a simplified implementation that avoids the complex Redux patterns
 * causing the TypeError: x(...) is undefined error
 */
const CreateGradeErrorWrapper = (props) => {
  // Add error logging for debugging
  React.useEffect(() => {
    console.log('[CreateGradeErrorWrapper] Component mounted - using simplified implementation');
    console.log('[CreateGradeErrorWrapper] This version bypasses complex Redux patterns to avoid errors');
    
    try {
      // Check Redux store structure for debugging purposes
      const reduxStore = window.__REDUX_DEVTOOLS_EXTENSION__ ? 
        window.__REDUX_DEVTOOLS_EXTENSION__.connect().getState() : 
        null;
      
      if (reduxStore) {
        // Log key slice information for debugging
        console.log('[DEBUG] Redux store structure detected:', {
          hasDirectionSlice: !!reduxStore.direction,
          hasStudentSlice: !!reduxStore.students,
          hasSubjectSlice: !!reduxStore.subjects,
          directionSliceKeys: reduxStore.direction ? Object.keys(reduxStore.direction) : [],
          studentSliceKeys: reduxStore.students ? Object.keys(reduxStore.students) : [],
          subjectSliceKeys: reduxStore.subjects ? Object.keys(reduxStore.subjects) : []
        });
      }
      
      // Still listen for any errors for diagnostic purposes
      const errorListener = (event) => {
        if (event.error) {
          console.log(`🔍 Error detected in CreateGrade: ${event.error.message}`);
          trackError(event.error, 'CreateGradeSimpleComponent');
        }
      };
      
      window.addEventListener('error', errorListener);
      
      // Cleanup
      return () => {
        window.removeEventListener('error', errorListener);
      };
    } catch (error) {
      console.error('[CreateGradeErrorWrapper] Error in setup:', error);
    }
  }, []);

  return (
    <ErrorBoundary componentName="CreateGradeSimple">
      <CreateGradeSimple {...props} />
    </ErrorBoundary>
  );
};

export default CreateGradeErrorWrapper;
