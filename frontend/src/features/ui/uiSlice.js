import { createSlice } from '@reduxjs/toolkit';

// Check if dark mode is saved in localStorage or use system preference
const getInitialDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    return JSON.parse(savedMode);
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState = {
  darkMode: getInitialDarkMode(),
  sidebarOpen: false,
  loading: false,
  error: null,
  success: false,
  message: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setSuccess: (state, action) => {
      state.success = action.payload;
      state.loading = false;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    resetUIState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = '';
    },
  },
});

export const {
  toggleDarkMode,
  toggleSidebar,
  setLoading,
  setError,
  setSuccess,
  setMessage,
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;
