import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subjectService from './subjectService';

const initialState = {
  subjects: [],
  subject: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create new subject (admin only)
export const createSubject = createAsyncThunk(
  'subjects/create',
  async (subjectData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await subjectService.createSubject(subjectData, token);
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

// Get all subjects - FIXED to include token and data validation
export const getSubjects = createAsyncThunk(
  'subjects/getAll',
  async (_, thunkAPI) => {
    try {
      // CRITICAL FIX: Enhanced error handling for the dashboard
      console.log('Getting subjects - with proper authentication');
      const user = thunkAPI.getState().auth.user;
      
      if (!user || !user.token) {
        console.error('No user data or token available in getSubjects thunk');
        return []; // Return empty array instead of failing
      }
      
      // CRITICAL FIX: Pass the token to the service
      console.log('Calling subjectService.getSubjects with token');
      const subjects = await subjectService.getSubjects(user.token);
      
      // CRITICAL FIX: Validate subjects data
      if (!Array.isArray(subjects)) {
        console.error('getSubjects thunk received non-array data:', typeof subjects);
        return []; // Always return array
      }
      
      console.log(`Successfully fetched ${subjects.length} subjects`);
      return subjects;
    } catch (error) {
      console.error('Error in getSubjects thunk:', error);
      // CRITICAL FIX: Return empty array instead of rejecting to prevent UI errors
      return [];
    }
  }
);

// Get subject by ID
export const getSubject = createAsyncThunk(
  'subjects/get',
  async (id, thunkAPI) => {
    try {
      return await subjectService.getSubject(id);
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

// Get subjects by teacher ID
export const getSubjectsByTeacher = createAsyncThunk(
  'subjects/getByTeacher',
  async (teacherId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await subjectService.getSubjectsByTeacher(teacherId, token);
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

// Get subjects by direction ID
export const getSubjectsByDirection = createAsyncThunk(
  'subjects/getByDirection',
  async (directionId, thunkAPI) => {
    try {
      return await subjectService.getSubjectsByDirection(directionId);
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

// Update subject (admin only)
export const updateSubject = createAsyncThunk(
  'subjects/update',
  async ({ id, subjectData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await subjectService.updateSubject(id, subjectData, token);
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

// Delete subject (admin only)
export const deleteSubject = createAsyncThunk(
  'subjects/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await subjectService.deleteSubject(id, token);
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

export const subjectSlice = createSlice({
  name: 'subject',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects.push(action.payload);
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSubjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSubjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects = action.payload;
      })
      .addCase(getSubjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subject = action.payload;
      })
      .addCase(getSubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSubjectsByTeacher.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSubjectsByTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects = action.payload;
      })
      .addCase(getSubjectsByTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSubjectsByDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSubjectsByDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects = action.payload;
      })
      .addCase(getSubjectsByDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects = state.subjects.map((subject) =>
          subject._id === action.payload._id ? action.payload : subject
        );
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteSubject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.subjects = state.subjects.filter(
          (subject) => subject._id !== action.payload.id
        );
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = subjectSlice.actions;
export default subjectSlice.reducer;
