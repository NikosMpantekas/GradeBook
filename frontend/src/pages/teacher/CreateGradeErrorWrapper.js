import React from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import CreateGrade from './CreateGrade';
import { trackError } from '../../utils/errorHandler';

/**
 * Special error boundary wrapper for the CreateGrade component
 * This adds extra debugging information specific to the persistent TypeError
 */
const CreateGradeErrorWrapper = (props) => {
  // Add specific instrumentation for the CreateGrade component
  React.useEffect(() => {
    console.log('[CreateGradeErrorWrapper] Component mounted - adding specific error detection');
    
    try {
      // Check Redux store structure
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
      
      // Add listener for the specific TypeError
      const errorListener = (event) => {
        if (event.error && event.error.message && 
            (event.error.message.includes('x(...) is undefined') || 
             event.error.message.includes('y(...) is undefined'))) {
          
          console.log('🔍 DETECTED CRITICAL ERROR: TypeError: x(...) is undefined');
          console.log('🔍 This is likely a Redux action or selector that is not properly exported');
          
          // Log helpful debugging information
          trackError(event.error, 'CreateGradeComponent');
          
          // You could add additional redux-specific debugging here
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
    <ErrorBoundary componentName="CreateGrade">
      <CreateGrade {...props} />
    </ErrorBoundary>
  );
};

export default CreateGradeErrorWrapper;
