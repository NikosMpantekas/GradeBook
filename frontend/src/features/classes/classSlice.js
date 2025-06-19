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
      const token = thunkAPI.getState().auth.user?.token;
      return await classService.getClasses(token);
    } catch (error) {
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
      const token = thunkAPI.getState().auth.user?.token;
      return await classService.createClass(classData, token);
    } catch (error) {
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
      const token = thunkAPI.getState().auth.user?.token;
      return await classService.getClass(id, token);
    } catch (error) {
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
      const token = thunkAPI.getState().auth.user?.token;
      return await classService.updateClass(classData, token);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete class
export const deleteClass = createAsyncThunk(
  'classes/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await classService.deleteClass(id, token);
    } catch (error) {
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
        state.classes = state.classes.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
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
      });
  },
});

export const { reset, setClass } = classSlice.actions;
export default classSlice.reducer;
