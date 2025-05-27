import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ratingService from './ratingService';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  periods: [],
  activePeriods: [],
  currentPeriod: null,
  questions: [],
  targets: {
    teachers: [],
    subjects: []
  },
  stats: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

// Create rating period
export const createRatingPeriod = createAsyncThunk(
  'ratings/createPeriod',
  async (periodData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.createRatingPeriod(periodData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all rating periods (admin)
export const getRatingPeriods = createAsyncThunk(
  'ratings/getPeriods',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getRatingPeriods(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single rating period
export const getRatingPeriod = createAsyncThunk(
  'ratings/getPeriod',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getRatingPeriod(id, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update rating period
export const updateRatingPeriod = createAsyncThunk(
  'ratings/updatePeriod',
  async ({ id, periodData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.updateRatingPeriod(id, periodData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete rating period
export const deleteRatingPeriod = createAsyncThunk(
  'ratings/deletePeriod',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.deleteRatingPeriod(id, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create rating question
export const createRatingQuestion = createAsyncThunk(
  'ratings/createQuestion',
  async (questionData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.createRatingQuestion(questionData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get questions for a rating period (admin version)
export const getRatingQuestions = createAsyncThunk(
  'ratings/getQuestions',
  async (periodId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getRatingQuestions(periodId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get questions for a rating period (student version)
export const getStudentRatingQuestions = createAsyncThunk(
  'ratings/getStudentQuestions',
  async (periodId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getStudentRatingQuestions(periodId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update rating question
export const updateRatingQuestion = createAsyncThunk(
  'ratings/updateQuestion',
  async ({ id, questionData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.updateRatingQuestion(id, questionData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete rating question
export const deleteRatingQuestion = createAsyncThunk(
  'ratings/deleteQuestion',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.deleteRatingQuestion(id, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Submit rating (student)
export const submitRating = createAsyncThunk(
  'ratings/submit',
  async (ratingData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.submitRating(ratingData, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get active rating periods (student)
export const getActiveRatingPeriods = createAsyncThunk(
  'ratings/getActivePeriods',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getActiveRatingPeriods(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get ratable teachers and subjects (student)
export const getRatingTargets = createAsyncThunk(
  'ratings/getTargets',
  async (periodId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getRatingTargets(periodId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get rating statistics
export const getRatingStats = createAsyncThunk(
  'ratings/getStats',
  async ({ targetType, targetId, periodId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.getRatingStats(targetType, targetId, periodId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Check if student has rated a target
export const checkStudentRating = createAsyncThunk(
  'ratings/checkRating',
  async ({ periodId, targetType, targetId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await ratingService.checkStudentRating(periodId, targetType, targetId, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Rating slice
export const ratingSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentPeriod: (state) => {
      state.currentPeriod = null;
    },
    clearQuestions: (state) => {
      state.questions = [];
    },
    clearTargets: (state) => {
      state.targets = {
        teachers: [],
        subjects: []
      };
    },
    clearStats: (state) => {
      state.stats = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create rating period
      .addCase(createRatingPeriod.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createRatingPeriod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.periods.push(action.payload);
        toast.success('Rating period created successfully');
      })
      .addCase(createRatingPeriod.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get rating periods
      .addCase(getRatingPeriods.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRatingPeriods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.periods = action.payload;
      })
      .addCase(getRatingPeriods.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get single rating period
      .addCase(getRatingPeriod.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRatingPeriod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentPeriod = action.payload;
      })
      .addCase(getRatingPeriod.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Update rating period
      .addCase(updateRatingPeriod.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateRatingPeriod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.periods = state.periods.map(period => 
          period._id === action.payload._id ? action.payload : period
        );
        state.currentPeriod = action.payload;
        toast.success('Rating period updated successfully');
      })
      .addCase(updateRatingPeriod.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Delete rating period
      .addCase(deleteRatingPeriod.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteRatingPeriod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.periods = state.periods.filter(period => period._id !== action.payload.id);
        toast.success('Rating period deleted successfully');
      })
      .addCase(deleteRatingPeriod.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Create rating question
      .addCase(createRatingQuestion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createRatingQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.questions.push(action.payload);
        toast.success('Rating question created successfully');
      })
      .addCase(createRatingQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get rating questions (admin)
      .addCase(getRatingQuestions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRatingQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.questions = action.payload;
      })
      .addCase(getRatingQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })
      
      // Get rating questions (student)
      .addCase(getStudentRatingQuestions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStudentRatingQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.questions = action.payload;
      })
      .addCase(getStudentRatingQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Update rating question
      .addCase(updateRatingQuestion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateRatingQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.questions = state.questions.map(question => 
          question._id === action.payload._id ? action.payload : question
        );
        toast.success('Rating question updated successfully');
      })
      .addCase(updateRatingQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Delete rating question
      .addCase(deleteRatingQuestion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteRatingQuestion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.questions = state.questions.filter(question => question._id !== action.payload.id);
        toast.success('Rating question deleted successfully');
      })
      .addCase(deleteRatingQuestion.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Submit rating
      .addCase(submitRating.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitRating.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        toast.success('Rating submitted successfully');
      })
      .addCase(submitRating.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get active rating periods
      .addCase(getActiveRatingPeriods.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActiveRatingPeriods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.activePeriods = action.payload;
      })
      .addCase(getActiveRatingPeriods.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get rating targets
      .addCase(getRatingTargets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRatingTargets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.targets = action.payload;
      })
      .addCase(getRatingTargets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // Get rating stats
      .addCase(getRatingStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRatingStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stats = action.payload;
      })
      .addCase(getRatingStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })
  }
});

export const { reset, clearCurrentPeriod, clearQuestions, clearTargets, clearStats } = ratingSlice.actions;
export default ratingSlice.reducer;
