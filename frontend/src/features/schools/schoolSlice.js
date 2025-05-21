import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import schoolService from './schoolService';

const initialState = {
  schools: [],
  school: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create new school (admin only)
export const createSchool = createAsyncThunk(
  'schools/create',
  async (schoolData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await schoolService.createSchool(schoolData, token);
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

// Get all schools
export const getSchools = createAsyncThunk(
  'schools/getAll',
  async (_, thunkAPI) => {
    try {
      // Log the action and token availability for debugging
      console.log('Fetching schools - checking auth state');
      const user = thunkAPI.getState().auth.user;
      
      // Handle missing user data more gracefully
      if (!user) {
        console.error('No user data available in getSchools thunk');
        return []; // Return empty array instead of failing
      }
      
      return await schoolService.getSchools();
    } catch (error) {
      console.error('Error fetching schools:', error);
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

// Get school by ID
export const getSchool = createAsyncThunk(
  'schools/get',
  async (id, thunkAPI) => {
    try {
      return await schoolService.getSchool(id);
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

// Update school (admin only)
export const updateSchool = createAsyncThunk(
  'schools/update',
  async ({ id, schoolData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await schoolService.updateSchool(id, schoolData, token);
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

// Delete school (admin only)
export const deleteSchool = createAsyncThunk(
  'schools/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await schoolService.deleteSchool(id, token);
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

export const schoolSlice = createSlice({
  name: 'school',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSchool.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSchool.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schools.push(action.payload);
      })
      .addCase(createSchool.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSchools.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchools.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schools = action.payload;
      })
      .addCase(getSchools.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSchool.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchool.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.school = action.payload;
      })
      .addCase(getSchool.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSchool.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSchool.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schools = state.schools.map((school) =>
          school._id === action.payload._id ? action.payload : school
        );
      })
      .addCase(updateSchool.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteSchool.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSchool.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schools = state.schools.filter(
          (school) => school._id !== action.payload.id
        );
      })
      .addCase(deleteSchool.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = schoolSlice.actions;
export default schoolSlice.reducer;
