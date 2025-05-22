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
      
      // If no students found for subject, try to get all students as fallback
      if (!response || !Array.isArray(response) || response.length === 0) {
        console.log('[studentSlice] No students found for subject, trying to get all students');
        response = await studentService.getStudents(token);
        
        if (Array.isArray(response) && response.length > 0) {
          console.log(`[studentSlice] Fallback returned ${response.length} total students`);
          // Filter students who have the selected subject
          response = response.filter(student => 
            student.subjects?.some(subj => 
              (typeof subj === 'string' && subj === subjectId) || 
              (subj._id === subjectId)
            )
          );
          console.log(`[studentSlice] ${response.length} students found with matching subject`);
        }
      }
      
      // Validate and process the response
      if (Array.isArray(response) && response.length > 0) {
        console.log(`[studentSlice] Returning ${response.length} students for subject ${subjectId}`);
        
        // Log first student details (without sensitive data)
        const firstStudent = response[0];
        console.log('[studentSlice] First student details:', {
          id: firstStudent._id,
          name: firstStudent.name,
          direction: firstStudent.direction,
          subjects: firstStudent.subjects,
          hasMobilePhone: !!firstStudent.mobilePhone,
          hasPersonalEmail: !!firstStudent.personalEmail
        });
        
        return response;
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
        stack: error.stack
      });
      
      // Try to get all students as a last resort
      try {
        const token = getState().auth.user?.token;
        if (token) {
          const allStudents = await studentService.getStudents(token);
          console.log(`[studentSlice] Fallback to all students returned ${allStudents?.length || 0} students`);
          return Array.isArray(allStudents) ? allStudents : [];
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.students = action.payload;
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
        state.students = action.payload;
      })
      .addCase(getStudentsBySubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getStudentsByDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentsByDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.students = action.payload;
      })
      .addCase(getStudentsByDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = studentSlice.actions;
export default studentSlice.reducer;
