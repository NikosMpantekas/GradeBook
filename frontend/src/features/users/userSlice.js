import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from './userService';

const initialState = {
  users: [],
  user: null,
  filteredUsers: [], // For getUsersByRole results
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Helper function to ensure data is always in the expected format
const ensureValidData = (data) => {
  if (!data) return null;
  
  // Clone the data to avoid modifying the original
  const validatedData = { ...data };
  
  // Ensure subjects is always an array
  if (validatedData.subjects === null || validatedData.subjects === undefined) {
    validatedData.subjects = [];
  } else if (!Array.isArray(validatedData.subjects)) {
    console.warn('Subjects data is not an array, converting to array:', validatedData.subjects);
    validatedData.subjects = [];
  }
  
  // Ensure schools is always an array
  if (validatedData.schools === null || validatedData.schools === undefined) {
    validatedData.schools = [];
  } else if (!Array.isArray(validatedData.schools)) {
    console.warn('Schools data is not an array, converting to array:', validatedData.schools);
    validatedData.schools = [];
  }
  
  // Ensure directions is always an array
  if (validatedData.directions === null || validatedData.directions === undefined) {
    validatedData.directions = [];
  } else if (!Array.isArray(validatedData.directions)) {
    console.warn('Directions data is not an array, converting to array:', validatedData.directions);
    validatedData.directions = [];
  }
  
  return validatedData;
};

// Get all users
export const getUsers = createAsyncThunk('users/getAll', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    
    if (!token) {
      console.error('No token available in getUsers thunk');
      return thunkAPI.rejectWithValue('Authentication token missing - please log in again');
    }
    
    console.log('Getting users with token:', token ? 'Token exists' : 'No token');
    return await userService.getUsers(token);
  } catch (error) {
    console.error('Error fetching users:', error);
    const message =
      (error.response &&
        error.response.data &&
        error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Create new user
export const createUser = createAsyncThunk(
  'users/create',
  async (userData, thunkAPI) => {
    try {
      console.log('Creating user with data:', { ...userData, password: '***HIDDEN***' });
      const token = thunkAPI.getState().auth.user.token;
      const result = await userService.createUser(userData, token);
      console.log('User creation result:', result);
      return result;
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

// Get user
export const getUser = createAsyncThunk(
  'users/get',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await userService.getUser(id, token);
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

// Get user by ID (alias for getUser to maintain backward compatibility)
export const getUserById = createAsyncThunk(
  'users/getUserById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await userService.getUserById(id, token);
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

// Update user
export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, userData }, thunkAPI) => {
    try {
      console.log('Updating user:', id, 'with data:', { ...userData, password: userData.password ? '***HIDDEN***' : undefined });
      const token = thunkAPI.getState().auth.user.token;
      return await userService.updateUser(id, userData, token);
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

// Get users by role with enhanced error handling
export const getUsersByRole = createAsyncThunk(
  'users/getByRole',
  async (role, thunkAPI) => {
    try {
      console.log(`Fetching users by role: ${role}`);
      const token = thunkAPI.getState().auth.user.token;
      
      if (!token) {
        console.error('No token available in getUsersByRole thunk');
        return thunkAPI.rejectWithValue('Authentication token missing - please log in again');
      }
      
      const results = await userService.getUsersByRole(role, token);
      console.log(`Found ${results.length} users with role: ${role}`);
      return results;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
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

// Delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await userService.deleteUser(id, token);
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

export const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    // Add a reducer to validate user data structure
    validateUserData: (state) => {
      if (state.user) {
        state.user = ensureValidData(state.user);
      }
      
      if (state.users && Array.isArray(state.users)) {
        state.users = state.users.map(user => ensureValidData(user));
      }
      
      if (state.filteredUsers && Array.isArray(state.filteredUsers)) {
        state.filteredUsers = state.filteredUsers.map(user => ensureValidData(user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Apply data validation to ensure all users have properly formatted arrays
        state.users = Array.isArray(action.payload) 
          ? action.payload.map(user => ensureValidData(user)) 
          : [];
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Validate the user data before adding to state
        if (action.payload && action.payload._id) {
          const validatedUser = ensureValidData(action.payload);
          state.users.push(validatedUser);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Apply data validation to ensure arrays are properly formatted
        state.user = ensureValidData(action.payload);
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle getUserById cases - map to same behavior as getUser
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Apply data validation to ensure arrays are properly formatted
        state.user = ensureValidData(action.payload);
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle getUsersByRole cases
      .addCase(getUsersByRole.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsersByRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Store the filtered users without replacing the main users list
        // Apply data validation to ensure all users have properly formatted arrays
        state.filteredUsers = Array.isArray(action.payload) 
          ? action.payload.map(user => ensureValidData(user)) 
          : [];
      })
      .addCase(getUsersByRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.filteredUsers = [];
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Handle the case where action.payload might be null or undefined
        if (action.payload && action.payload._id) {
          // Validate the user data before updating state
          const validatedUser = ensureValidData(action.payload);
          
          // Update the user in the users array
          if (state.users && state.users.length > 0) {
            state.users = state.users.map((user) =>
              user._id === validatedUser._id ? validatedUser : ensureValidData(user)
            );
          }
          // Also update the single user if it matches
          if (state.user && state.user._id === validatedUser._id) {
            state.user = validatedUser;
          }
        } else {
          console.warn('Received invalid payload in updateUser.fulfilled', action.payload);
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // Log what we received from the backend
        console.log('DELETE USER SUCCESS - payload:', action.payload);
        
        // Check for the expected id in the payload
        const userId = action.payload?.id;
        
        if (userId) {
          // Remove the user from the users array
          if (state.users && state.users.length > 0) {
            const prevCount = state.users.length;
            state.users = state.users.filter(user => user._id !== userId);
            
            // Log whether any user was actually removed
            console.log(`Removed user from state: ${prevCount > state.users.length ? 'YES' : 'NO'}`);
          }
          
          // If the currently selected user was deleted, clear it
          if (state.user && state.user._id === userId) {
            state.user = null;
          }
        } else {
          console.warn('Missing id in deleteUser.fulfilled payload', action.payload);
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = userSlice.actions;
export default userSlice.reducer;
