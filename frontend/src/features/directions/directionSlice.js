import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import directionService from './directionService';

const initialState = {
  directions: [],
  direction: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Create new direction (admin only)
export const createDirection = createAsyncThunk(
  'directions/create',
  async (directionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await directionService.createDirection(directionData, token);
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

// Get all directions - FIXED to pass the token
export const getDirections = createAsyncThunk(
  'directions/getAll',
  async (_, thunkAPI) => {
    try {
      // CRITICAL FIX: Enhanced error handling and debugging
      console.log('Fetching directions data - for admin dashboard');
      const user = thunkAPI.getState().auth.user;
      
      if (!user || !user.token) {
        console.error('No user data or token available in getDirections thunk');
        return []; // Return empty array to prevent dashboard from failing
      }
      
      // CRITICAL FIX: Pass the token to the service
      console.log('Calling directionService.getDirections with token');
      const directions = await directionService.getDirections(user.token);
      
      // CRITICAL FIX: Data validation
      if (!Array.isArray(directions)) {
        console.error('getDirections thunk received non-array data:', typeof directions);
        return []; // Always return array
      }
      
      console.log(`Successfully fetched ${directions.length} directions`);
      return directions;
    } catch (error) {
      console.error('Error in getDirections thunk:', error);
      // CRITICAL FIX: Return empty array on rejection to prevent UI errors
      return [];
    }
  }
);

// Get direction by ID - FIXED to pass the token
export const getDirection = createAsyncThunk(
  'directions/get',
  async (id, thunkAPI) => {
    try {
      const user = thunkAPI.getState().auth.user;
      
      if (!user || !user.token) {
        console.error('No user data or token available in getDirection thunk');
        return null; // Return null for a single direction
      }
      
      // CRITICAL FIX: Pass the token to the service
      return await directionService.getDirection(id, user.token);
    } catch (error) {
      console.error(`Error fetching direction ${id}:`, error);
      return null;
    }
  }
);

// Update direction (admin only)
export const updateDirection = createAsyncThunk(
  'directions/update',
  async ({ id, directionData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await directionService.updateDirection(id, directionData, token);
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

// Delete direction (admin only)
export const deleteDirection = createAsyncThunk(
  'directions/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await directionService.deleteDirection(id, token);
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

export const directionSlice = createSlice({
  name: 'direction',
  initialState,
  reducers: {
    reset: (state) => initialState,
    // CRITICAL FIX: Add data validation reducer
    ensureValidData: (state) => {
      // Ensure directions is always an array
      if (!Array.isArray(state.directions)) {
        console.warn('[directionSlice] Fixed invalid directions data type:', typeof state.directions);
        state.directions = [];
      }
      
      // Validate each direction in the array
      state.directions = state.directions.filter(dir => {
        if (!dir || typeof dir !== 'object') {
          console.warn('[directionSlice] Removed invalid direction:', dir);
          return false;
        }
        return true;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.directions.push(action.payload);
      })
      .addCase(createDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDirections.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDirections.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // CRITICAL FIX: Ensure payload is always an array
        if (!Array.isArray(action.payload)) {
          console.warn('[directionSlice] getDirections.fulfilled received non-array payload:', typeof action.payload);
          state.directions = [];
        } else {
          state.directions = action.payload;
          console.log(`[directionSlice] Set ${action.payload.length} directions in store`);
        }
      })
      .addCase(getDirections.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.direction = action.payload;
      })
      .addCase(getDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.directions = state.directions.map((direction) =>
          direction._id === action.payload._id ? action.payload : direction
        );
      })
      .addCase(updateDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteDirection.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteDirection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.directions = state.directions.filter(
          (direction) => direction._id !== action.payload.id
        );
      })
      .addCase(deleteDirection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = directionSlice.actions;
export default directionSlice.reducer;
