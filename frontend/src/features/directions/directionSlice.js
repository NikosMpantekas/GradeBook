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

// Get all directions
export const getDirections = createAsyncThunk(
  'directions/getAll',
  async (_, thunkAPI) => {
    try {
      // Better error handling for the admin dashboard
      console.log('Fetching directions data - for admin dashboard');
      const user = thunkAPI.getState().auth.user;
      
      if (!user) {
        console.error('No user data available in getDirections thunk');
        return []; // Return empty array to prevent dashboard from failing
      }
      
      return await directionService.getDirections();
    } catch (error) {
      console.error('Error fetching directions:', error);
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

// Get direction by ID
export const getDirection = createAsyncThunk(
  'directions/get',
  async (id, thunkAPI) => {
    try {
      return await directionService.getDirection(id);
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
        state.directions = action.payload;
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
