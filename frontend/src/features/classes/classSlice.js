import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import classService from './classService';

const initialState = {
  classes: [],
  class: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Get all classes
export const getClasses = createAsyncThunk(
  'classes/getAll',
  async (_, thunkAPI) => {
    try {
      // Check for user and token
      const user = thunkAPI.getState().auth.user;
      if (!user || !user.token) {
        console.error('No user or token available in getClasses thunk');
        return thunkAPI.rejectWithValue('Authentication error: Please log in again');
      }
      
      // Get classes with proper token
      const result = await classService.getClasses(user.token);
      return result;
    } catch (error) {
      console.error('Error in getClasses thunk:', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create new class
export const createClass = createAsyncThunk(
  'classes/create',
  async (classData, thunkAPI) => {
    try {
      // Check for user and token
      const user = thunkAPI.getState().auth.user;
      if (!user || !user.token) {
        console.error('No user or token available in createClass thunk');
        return thunkAPI.rejectWithValue('Authentication error: Please log in again');
      }
      
      // Create class with proper token
      return await classService.createClass(classData, user.token);
    } catch (error) {
      console.error('Error in createClass thunk:', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get class by ID
export const getClass = createAsyncThunk(
  'classes/get',
  async (id, thunkAPI) => {
    try {
      // Check for user and token
      const user = thunkAPI.getState().auth.user;
      if (!user || !user.token) {
        console.error('No user or token available in getClass thunk');
        return thunkAPI.rejectWithValue('Authentication error: Please log in again');
      }
      
      return await classService.getClass(id, user.token);
    } catch (error) {
      console.error('Error in getClass thunk:', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update class
export const updateClass = createAsyncThunk(
  'classes/update',
  async (classData, thunkAPI) => {
    try {
      // Validate we have a class ID
      const classId = classData._id || classData.id;
      if (!classId) {
        console.error('Missing class ID in updateClass thunk:', classData);
        return thunkAPI.rejectWithValue('Class ID is required for update');
      }

      console.log(`updateClass thunk executing with ID: ${classId}`, classData);
      
      const token = thunkAPI.getState().auth.user.token;
      const result = await classService.updateClass(classData, token);
      
      console.log('Class service returned:', result);
      
      // Make sure the result has the ID for proper state update
      if (result && !result._id && classId) {
        console.log('Adding missing _id to result');
        result._id = classId;
      }
      
      return result;
    } catch (error) {
      console.error('updateClass thunk error:', error);
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

// Delete class
export const deleteClass = createAsyncThunk(
  'classes/delete',
  async (id, thunkAPI) => {
    try {
      // Check for user and token
      const user = thunkAPI.getState().auth.user;
      if (!user || !user.token) {
        console.error('No user or token available in deleteClass thunk');
        return thunkAPI.rejectWithValue('Authentication error: Please log in again');
      }
      
      // Delete class with proper token
      return await classService.deleteClass(id, user.token);
    } catch (error) {
      console.error('Error in deleteClass thunk:', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get classes by teacher ID
export const getClassesByTeacher = createAsyncThunk(
  'classes/getByTeacher',
  async (teacherId, thunkAPI) => {
    try {
      // Check for user and token
      const user = thunkAPI.getState().auth.user;
      if (!user || !user.token) {
        console.error('No user or token available in getClassesByTeacher thunk');
        return thunkAPI.rejectWithValue('Authentication error: Please log in again');
      }
      
      // Get classes for the specified teacher with proper token
      return await classService.getClassesByTeacher(teacherId, user.token);
    } catch (error) {
      console.error('Error in getClassesByTeacher thunk:', error);
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const classSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setClass: (state, action) => {
      state.class = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getClasses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.classes = action.payload;
      })
      .addCase(getClasses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createClass.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.classes.push(action.payload);
      })
      .addCase(createClass.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getClass.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.class = action.payload;
      })
      .addCase(getClass.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateClass.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // Ensure we have a valid payload with _id
        if (action.payload && action.payload._id) {
          console.log(`Updating class in store with ID: ${action.payload._id}`);
          
          // Find if this class exists in the store
          const existingIndex = state.classes.findIndex(c => c._id === action.payload._id);
          
          if (existingIndex >= 0) {
            // Replace existing class in the array
            console.log(`Found existing class at index ${existingIndex}, replacing it`);
            state.classes = [
              ...state.classes.slice(0, existingIndex),
              action.payload,
              ...state.classes.slice(existingIndex + 1)
            ];
          } else {
            // If not found, add it to the array
            console.log('Class not found in store, adding it');
            state.classes.push(action.payload);
          }
        } else {
          console.error('Update class response missing _id:', action.payload);
        }
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteClass.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.classes = state.classes.filter((c) => c._id !== action.payload.id);
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getClassesByTeacher.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClassesByTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.classes = action.payload;
      })
      .addCase(getClassesByTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setClass } = classSlice.actions;
export default classSlice.reducer;
