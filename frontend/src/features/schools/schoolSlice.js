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

/**
 * CRITICAL FIX: Definitive cluster school detection and filtering
 * This is a comprehensive solution to ensure cluster schools never appear in the UI
 * @param {Object} school - School object to check
 * @returns {boolean} - True if this is a cluster school that should be filtered out
 */
const isClusterSchool = (school) => {
  try {
    // Handle null/undefined schools
    if (!school) return true; // Safety: filter out undefined schools
    
    // Multi-layer detection:
    
    // 1. Check explicit flag first (most reliable)
    if (school.isClusterSchool === true) {
      console.log(`Filtering cluster school by flag: ${school.name}`);
      return true;
    }
    
    // 2. Check name patterns for legacy data (comprehensive pattern matching)
    const clusterPatterns = /primary|cluster|general|main|central|district|organization/i;
    if (school.name && typeof school.name === 'string' && clusterPatterns.test(school.name)) {
      console.log(`Filtering cluster school by name pattern: ${school.name}`);
      return true;
    }
    
    // 3. Check for very short names (likely acronyms for districts)
    if (school.name && typeof school.name === 'string' && school.name.length < 5) {
      console.log(`Filtering potential cluster by short name: ${school.name}`);
      return true;
    }
    
    return false;
  } catch (error) {
    // Safety: If any error occurs during detection, filter the school out
    console.error('Error in cluster school detection, filtering out for safety:', error);
    return true;
  }
};

/**
 * CRITICAL FIX: Safe filtering function with comprehensive error handling
 * @param {Array} schools - Array of schools to filter
 * @returns {Array} - Filtered schools with all cluster schools removed
 */
const filterOutClusterSchools = (schools) => {
  try {
    // Validate input is an array
    if (!Array.isArray(schools)) {
      console.error('School data is not an array:', schools);
      return [];
    }
    
    // Apply robust filtering
    const filteredSchools = schools.filter(school => !isClusterSchool(school));
    console.log(`Filtered ${schools.length - filteredSchools.length} cluster schools from data`);
    
    return filteredSchools;
  } catch (error) {
    // Safety: If any error occurs during filtering, return empty array
    console.error('Critical error in school filtering, returning empty array:', error);
    return [];
  }
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
      if (!user || !user.token) {
        console.error('No user data or token available in getSchools thunk');
        return []; // Return empty array instead of failing
      }
      
      return await schoolService.getSchools(user.token);
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
      // Validate school ID before making the API call
      if (!id || id === 'undefined') {
        return thunkAPI.rejectWithValue('School ID is required for update');
      }
      
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
        
        // CRITICAL FIX: Apply cluster school filtering at the Redux level
        // This ensures cluster/primary schools never appear in the UI
        if (Array.isArray(action.payload)) {
          console.log(`Received ${action.payload.length} schools from API`);
          const filteredSchools = filterOutClusterSchools(action.payload);
          console.log(`After filtering out cluster schools: ${filteredSchools.length} schools remain`);
          state.schools = filteredSchools;
        } else {
          console.warn('Schools data is not an array:', action.payload);
          state.schools = [];
        }
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
