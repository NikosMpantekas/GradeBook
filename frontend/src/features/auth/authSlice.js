import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// Get user from localStorage or sessionStorage
const localUser = localStorage.getItem('user');
const sessionUser = sessionStorage.getItem('user');

// Use user data from either storage location
let user = null;
try {
  if (localUser) {
    user = JSON.parse(localUser);
  } else if (sessionUser) {
    user = JSON.parse(sessionUser);
  }
} catch (error) {
  console.error('Error parsing user data from storage:', error);
}

const initialState = {
  user: user,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (user, thunkAPI) => {
    try {
      return await authService.register(user);
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

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (user, thunkAPI) => {
    try {
      return await authService.login(user);
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

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await authService.updateProfile(userData, token);
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

// Get current user data with populated references
export const getUserData = createAsyncThunk(
  'auth/getUserData',
  async (_, thunkAPI) => {
    try {
      // Get token from state
      const token = thunkAPI.getState().auth.user.token;
      // Get updated user data with populated fields
      return await authService.getUserData(token);
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

// Update current user permissions
export const updateCurrentUserPermissions = createAsyncThunk(
  'auth/updatePermissions',
  async ({userId, permissions}, thunkAPI) => {
    try {
      // Only proceed if this is the current logged-in user
      const currentUser = thunkAPI.getState().auth.user;
      if (currentUser && currentUser._id === userId) {
        // Update permissions in local/session storage
        const updatedUser = {
          ...currentUser,
          ...permissions
        };
        
        // Update storage based on where the user data is currently stored
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return updatedUser;
      }
      return thunkAPI.getState().auth.user;
    } catch (error) {
      console.error('Failed to update user permissions:', error);
      return thunkAPI.getState().auth.user;
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    updatePermissions: (state, action) => {
      // Only update if this is the current user
      if (state.user && state.user._id === action.payload.userId) {
        state.user = {
          ...state.user,
          ...action.payload.permissions
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(getUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle updating user permissions
      .addCase(updateCurrentUserPermissions.fulfilled, (state, action) => {
        if (action.payload && state.user && state.user._id === action.payload._id) {
          state.user = action.payload;
        }
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
