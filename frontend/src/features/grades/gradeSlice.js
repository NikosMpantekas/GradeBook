import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import gradeService from './gradeService';

const initialState = {
  grades: [],
  grade: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create new grade
export const createGrade = createAsyncThunk(
  'grades/create',
  async (gradeData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await gradeService.createGrade(gradeData, token);
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

// Get all grades (admin only)
export const getAllGrades = createAsyncThunk(
  'grades/getAll',
  async (_, thunkAPI) => {
    try {
      // Verify the user is an admin
      const { user } = thunkAPI.getState().auth;
      if (!user || user.role !== 'admin') {
        return thunkAPI.rejectWithValue('Only admin users can access all grades');
      }
      
      console.log('Dispatching getAllGrades action for admin');
      const token = user.token;
      
      const data = await gradeService.getAllGrades(token);
      console.log(`Admin action received ${data?.length || 0} grades from service`);
      
      // Always make sure we return an array to the reducer
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getAllGrades thunk:', error);
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

// Get student grades
export const getStudentGrades = createAsyncThunk(
  'grades/getStudentGrades',
  async (studentId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await gradeService.getStudentGrades(studentId, token);
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

// Get grades by subject
export const getGradesBySubject = createAsyncThunk(
  'grades/getBySubject',
  async (subjectId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await gradeService.getGradesBySubject(subjectId, token);
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

// Get grades by teacher
export const getGradesByTeacher = createAsyncThunk(
  'grades/getByTeacher',
  async (teacherId, thunkAPI) => {
    try {
      if (!teacherId) {
        return thunkAPI.rejectWithValue('Teacher ID is required');
      }
      
      console.log('Dispatching getGradesByTeacher action for teacher:', teacherId);
      const token = thunkAPI.getState().auth.user.token;
      
      const data = await gradeService.getGradesByTeacher(teacherId, token);
      console.log(`Action received ${data?.length || 0} grades from service`);
      
      // Always make sure we return an array to the reducer
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getGradesByTeacher thunk:', error);
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

// Get grade
export const getGrade = createAsyncThunk(
  'grades/get',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await gradeService.getGrade(id, token);
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

// Update grade
export const updateGrade = createAsyncThunk(
  'grades/update',
  async ({ id, gradeData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await gradeService.updateGrade(id, gradeData, token);
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

// Delete grade
export const deleteGrade = createAsyncThunk(
  'grades/delete',
  async (gradeId, thunkAPI) => {
    try {
      console.log('Dispatching deleteGrade action for grade:', gradeId);
      const token = thunkAPI.getState().auth.user.token;
      
      await gradeService.deleteGrade(gradeId, token);
      console.log('Grade deleted successfully from backend');
      
      // Return the gradeId so the reducer can filter it out
      return { id: gradeId };
    } catch (error) {
      console.error('Error in deleteGrade thunk:', error);
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

export const gradeSlice = createSlice({
  name: 'grade',
  initialState,
  reducers: {
    reset: (state) => {
      // Keep the existing grades array but reset all other flags
      return {
        ...initialState,
        grades: state.grades || [],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGrade.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createGrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades.push(action.payload);
        state.grade = action.payload;
      })
      .addCase(createGrade.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAllGrades.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = action.payload;
      })
      .addCase(getAllGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getStudentGrades.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = action.payload;
      })
      .addCase(getStudentGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGradesBySubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGradesBySubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = action.payload;
      })
      .addCase(getGradesBySubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGradesByTeacher.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGradesByTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = action.payload;
      })
      .addCase(getGradesByTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGrade.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grade = action.payload;
      })
      .addCase(getGrade.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateGrade.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateGrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = state.grades.map((grade) =>
          grade._id === action.payload._id ? action.payload : grade
        );
      })
      .addCase(updateGrade.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteGrade.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteGrade.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.grades = state.grades.filter(
          (grade) => grade._id !== action.payload.id
        );
      })
      .addCase(deleteGrade.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = gradeSlice.actions;
export default gradeSlice.reducer;
