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

// Get students by subject
export const getStudentsBySubject = createAsyncThunk(
  'students/getBySubject',
  async (subjectId, thunkAPI) => {
    try {
      console.log(`[studentSlice] Dispatching getStudentsBySubject for subject: ${subjectId}`);
      const token = thunkAPI.getState().auth.user.token;
      
      // First try to get students by subject
      const response = await studentService.getStudentsBySubject(subjectId, token);
      console.log(`[studentSlice] Received ${response?.length || 0} students for subject ${subjectId}`);
      
      // Log the first student for debugging
      if (response?.length > 0) {
        console.log('[studentSlice] First student data:', {
          id: response[0]._id,
          name: response[0].name,
          direction: response[0].direction,
          subjects: response[0].subjects
        });
      }
      
      // Ensure we have a valid array before returning
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
      
      // If no students found for subject, try to get all students
      console.log('[studentSlice] No students found for subject, trying to get all students');
      const allStudents = await studentService.getStudents(token);
      console.log(`[studentSlice] Fallback returned ${allStudents?.length || 0} total students`);
      
      return allStudents || [];
      
    } catch (error) {
      console.error('[studentSlice] Error in getStudentsBySubject:', {
        error: error.message,
        response: error.response?.data
      });
      
      // Return empty array to prevent UI crashes
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
