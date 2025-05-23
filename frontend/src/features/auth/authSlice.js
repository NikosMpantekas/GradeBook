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
  
  // Validate that user has required fields
  if (user) {
    // Check if token exists and is valid
    if (!user.token || typeof user.token !== 'string' || user.token === 'undefined') {
      console.error('Invalid token detected in stored user data - clearing auth state');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      user = null;
    } else {
      console.log('Valid authentication found in storage');
    }
  }
} catch (error) {
  console.error('Error parsing user data from storage:', error);
  // Clear invalid data
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
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
        console.log('Updating permissions for current user:', userId);
        console.log('New permissions:', permissions);
        
        // Create updated user object with new permissions
        const updatedUser = {
          ...currentUser,
          ...permissions
        };
        
        // Force an immediate update to both storage locations to ensure it takes effect
        if (localStorage.getItem('user')) {
          localStorage.removeItem('user');
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated localStorage with new permissions');
        }
        
        if (sessionStorage.getItem('user')) {
          sessionStorage.removeItem('user');
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('Updated sessionStorage with new permissions');
        }
        
        // Force a page reload to ensure the new permissions take effect
        // This is a somewhat heavy-handed approach but ensures UI components update
        setTimeout(() => {
          console.log('Permission update complete - forcing refresh');
          window.location.reload();
        }, 1000);
        
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
        
        // Special handling for superadmin users to ensure all required fields exist
        if (action.payload?.role === 'superadmin') {
          console.log('Processing superadmin login response');
          
          // Ensure all required fields are present for superadmin
          const superadminUser = {
            ...action.payload,
            // Ensure these fields exist with default values if not present
            school: action.payload.school || null,
            schoolId: action.payload.schoolId || null,
            schoolName: action.payload.schoolName || null,
            schools: action.payload.schools || [],
            directions: action.payload.directions || [],
            subjects: action.payload.subjects || [],
            darkMode: action.payload.darkMode || false
          };
          
          state.user = superadminUser;
          console.log('Superadmin user processed successfully:', {
            id: superadminUser._id,
            role: superadminUser.role,
            hasToken: !!superadminUser.token
          });
        } else {
          // Normal handling for non-superadmin users
          state.user = action.payload;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        // Full state reset on logout
        state.user = null;
        state.isError = false;
        state.isSuccess = false;
        state.isLoading = false;
        state.message = '';
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
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
