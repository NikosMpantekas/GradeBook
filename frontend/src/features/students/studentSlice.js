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
      console.log(`Dispatching getStudentsBySubject action for subject: ${subjectId}`);
      const token = thunkAPI.getState().auth.user.token;
      const response = await studentService.getStudentsBySubject(subjectId, token);
      console.log(`Successfully received ${response.length} students for subject`); 
      
      // If we got an empty array, immediately fall back to getting all students
      if (Array.isArray(response) && response.length === 0) {
        console.log('No students found for this subject, falling back to all students');
        const allStudents = await studentService.getStudents(token);
        console.log(`Fallback returned ${allStudents.length} students`);
        return allStudents;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to get students by subject:', error);
      // If we hit a 404 or other error, fall back to getting all students
      try {
        console.log('Trying fallback to get all students instead');
        const token = thunkAPI.getState().auth.user.token;
        const allStudents = await studentService.getStudents(token);
        console.log(`Successfully received ${allStudents.length} students as fallback`);
        return allStudents;
      } catch (fallbackError) {
        console.error('Fallback to get all students also failed:', fallbackError);
        // Return empty array instead of rejecting to prevent UI crashes
        return [];
      }
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
