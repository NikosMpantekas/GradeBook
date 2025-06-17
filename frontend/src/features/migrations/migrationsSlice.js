import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import migrationsService from './migrationsService';

const initialState = {
  migrations: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  currentMigration: null,
  migrationResult: null
};

// Get all available migrations
export const getMigrations = createAsyncThunk(
  'migrations/getAll',
  async (_, thunkAPI) => {
    try {
      return await migrationsService.getMigrations();
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

// Run a migration
export const runMigration = createAsyncThunk(
  'migrations/run',
  async (migrationType, thunkAPI) => {
    try {
      return await migrationsService.runMigration(migrationType);
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

export const migrationsSlice = createSlice({
  name: 'migrations',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
      state.currentMigration = null;
      state.migrationResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get migrations
      .addCase(getMigrations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMigrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.migrations = action.payload.migrations;
      })
      .addCase(getMigrations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(`Failed to load migrations: ${action.payload}`);
      })
      
      // Run migration
      .addCase(runMigration.pending, (state, action) => {
        state.isLoading = true;
        state.currentMigration = action.meta.arg;
      })
      .addCase(runMigration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.migrationResult = action.payload.result;
        toast.success(`Migration '${state.currentMigration}' completed successfully`);
      })
      .addCase(runMigration.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(`Migration failed: ${action.payload}`);
      });
  }
});

export const { reset } = migrationsSlice.actions;
export default migrationsSlice.reducer;
