import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import studentService from './studentService';

const initialState = {
  students: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Get all students
export const getStudents = createAsyncThunk(
  'students/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await studentService.getStudents(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get students by subject with enhanced error handling and logging
export const getStudentsBySubject = createAsyncThunk(
  'students/getBySubject',
  async (subjectId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.user?.token;
      if (!token) {
        console.warn('[studentSlice] No auth token available');
        return [];
      }
      
      if (!subjectId) {
        console.warn('[studentSlice] No subjectId provided');
        return [];
      }
      
      console.log(`[studentSlice] Fetching students for subject: ${subjectId}`);
      
      // Try to get students by subject first
      let response = await studentService.getStudentsBySubject(subjectId, token);
      
      // Log the raw response for debugging
      console.log('[studentSlice] Raw response from API:', {
        responseType: Array.isArray(response) ? 'array' : typeof response,
        responseLength: Array.isArray(response) ? response.length : 'N/A',
        firstItem: Array.isArray(response) && response[0] ? {
          id: response[0]._id,
          name: response[0].name,
          direction: response[0].direction,
          subjects: response[0].subjects
        } : 'N/A'
      });
      
      // If no students found or invalid response, try to get all students as fallback
      if (!response || !Array.isArray(response) || response.length === 0) {
        console.log('[studentSlice] No students found for subject, trying to get all students');
        const allStudents = await studentService.getStudents(token);
        
        if (Array.isArray(allStudents) && allStudents.length > 0) {
          console.log(`[studentSlice] Fallback returned ${allStudents.length} total students`);
          // Filter students who have the selected subject
          response = allStudents.filter(student => {
            const hasSubject = student.subjects?.some(subj => {
              const subjId = typeof subj === 'string' ? subj : subj?._id;
              return subjId === subjectId;
            });
            
            if (hasSubject) {
              console.log(`[studentSlice] Student ${student.name} has subject ${subjectId}`);
            }
            
            return hasSubject;
          });
          
          console.log(`[studentSlice] ${response.length} students found with matching subject`);
        }
      }
      
      // Validate and process the response
      if (Array.isArray(response) && response.length > 0) {
        // Ensure each student has required fields
        const processedStudents = response.map(student => ({
          _id: student._id,
          name: student.name,
          email: student.email || '',
          mobilePhone: student.mobilePhone || '',
          personalEmail: student.personalEmail || '',
          direction: student.direction || {},
          subjects: Array.isArray(student.subjects) 
            ? student.subjects.map(s => ({
                _id: s._id || s,
                name: s.name || 'Unknown Subject'
              }))
            : []
        }));
        
        console.log(`[studentSlice] Returning ${processedStudents.length} students for subject ${subjectId}`);
        
        // Log first student details (without sensitive data)
        const firstStudent = processedStudents[0];
        console.log('[studentSlice] First student details:', {
          id: firstStudent._id,
          name: firstStudent.name,
          direction: firstStudent.direction,
          subjectCount: firstStudent.subjects?.length || 0,
          hasMobilePhone: !!firstStudent.mobilePhone,
          hasPersonalEmail: !!firstStudent.personalEmail
        });
        
        return processedStudents;
      }
      
      console.log('[studentSlice] No students found after all attempts');
      return [];
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch students';
      console.error('[studentSlice] Error in getStudentsBySubject:', {
        message: errorMessage,
        subjectId,
        status: error.response?.status,
        data: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production'
      });
      
      // Try to get all students as a last resort
      try {
        const token = getState().auth.user?.token;
        if (token) {
          const allStudents = await studentService.getStudents(token);
          console.log(`[studentSlice] Fallback to all students returned ${allStudents?.length || 0} students`);
          
          if (Array.isArray(allStudents)) {
            // Filter by subject if possible
            const filteredStudents = allStudents.filter(student => {
              if (!student.subjects) return false;
              return student.subjects.some(subj => {
                const subjId = typeof subj === 'string' ? subj : subj?._id;
                return subjId === subjectId;
              });
            });
            
            console.log(`[studentSlice] Found ${filteredStudents.length} students with subject ${subjectId} in fallback`);
            return filteredStudents;
          }
          
          return [];
        }
      } catch (fallbackError) {
        console.error('[studentSlice] Fallback failed:', fallbackError);
      }
      
      return [];
    }
  }
);

// Get students by direction
export const getStudentsByDirection = createAsyncThunk(
  'students/getByDirection',
  async (directionId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await studentService.getStudentsByDirection(directionId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    // CRITICAL FIX: Add this reducer to ensure students is always an array
    ensureValidData: (state) => {
      // Ensure students is always an array to prevent .map() errors
      if (!Array.isArray(state.students)) {
        console.warn('[studentSlice] Fixed invalid students data type:', typeof state.students);
        state.students = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // CRITICAL FIX: Ensure payload is an array before setting it
        state.students = Array.isArray(action.payload) ? action.payload : [];
        if (!Array.isArray(action.payload)) {
          console.warn('[studentSlice] getStudents.fulfilled received non-array data:', typeof action.payload);
        }
      })
      .addCase(getStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getStudentsBySubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentsBySubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // CRITICAL FIX: Ensure payload is an array before setting it
        state.students = Array.isArray(action.payload) ? action.payload : [];
        if (!Array.isArray(action.payload)) {
          console.warn('[studentSlice] getStudentsBySubject.fulfilled received non-array data:', typeof action.payload);
        }
      })
      .addCase(getStudentsBySubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        // CRITICAL FIX: Set empty array on failure to prevent UI errors
        state.students = [];
      })
      .addCase(getStudentsByDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentsByDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // CRITICAL FIX: Ensure payload is an array before setting it
        state.students = Array.isArray(action.payload) ? action.payload : [];
        if (!Array.isArray(action.payload)) {
          console.warn('[studentSlice] getStudentsByDirection.fulfilled received non-array data:', typeof action.payload);
        }
      })
      .addCase(getStudentsByDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        // CRITICAL FIX: Set empty array on failure to prevent UI errors
        state.students = [];
      });
  },
});

export const { reset } = studentSlice.actions;
export default studentSlice.reducer;
