import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import superAdminService from './superAdminService';

const initialState = {
  schoolOwners: [],
  schoolOwner: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create school owner
export const createSchoolOwner = createAsyncThunk(
  'superAdmin/createSchoolOwner',
  async (schoolOwnerData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await superAdminService.createSchoolOwner(schoolOwnerData, token);
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

// Get all school owners
export const getSchoolOwners = createAsyncThunk(
  'superAdmin/getSchoolOwners',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await superAdminService.getSchoolOwners(token);
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

// Get school owner by ID
export const getSchoolOwnerById = createAsyncThunk(
  'superAdmin/getSchoolOwnerById',
  async (ownerId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await superAdminService.getSchoolOwnerById(ownerId, token);
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

// Update school owner status
export const updateSchoolOwnerStatus = createAsyncThunk(
  'superAdmin/updateSchoolOwnerStatus',
  async ({ id, statusData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await superAdminService.updateSchoolOwnerStatus(id, statusData, token);
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

// Create first superadmin
export const createFirstSuperAdmin = createAsyncThunk(
  'superAdmin/createFirstSuperAdmin',
  async (userData, thunkAPI) => {
    try {
      return await superAdminService.createFirstSuperAdmin(userData);
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

export const superAdminSlice = createSlice({
  name: 'superAdmin',
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
      .addCase(createSchoolOwner.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSchoolOwner.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schoolOwners.push(action.payload.user);
      })
      .addCase(createSchoolOwner.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSchoolOwners.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchoolOwners.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schoolOwners = action.payload;
      })
      .addCase(getSchoolOwners.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSchoolOwnerById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchoolOwnerById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schoolOwner = action.payload;
      })
      .addCase(getSchoolOwnerById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSchoolOwnerStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSchoolOwnerStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schoolOwners = state.schoolOwners.map((owner) =>
          owner._id === action.payload._id ? { ...owner, active: action.payload.active } : owner
        );
        if (state.schoolOwner && state.schoolOwner._id === action.payload._id) {
          state.schoolOwner.active = action.payload.active;
        }
      })
      .addCase(updateSchoolOwnerStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createFirstSuperAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createFirstSuperAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(createFirstSuperAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = superAdminSlice.actions;
export default superAdminSlice.reducer;
