import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  timerEnabled: true,
  soundEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    toggleTimer(state) {
      state.timerEnabled = !state.timerEnabled;
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
    },
    loadSettings(state, action) {
      return { ...state, ...action.payload };
    },
  },
});

export const { toggleTheme, toggleTimer, toggleSound, loadSettings } =
  settingsSlice.actions;
export default settingsSlice.reducer;
