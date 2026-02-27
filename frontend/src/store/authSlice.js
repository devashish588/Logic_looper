import { createSlice } from '@reduxjs/toolkit';

// Hydrate from localStorage on load
function loadFromStorage() {
  try {
    const token = localStorage.getItem('ll_token');
    const user = localStorage.getItem('ll_user');
    if (token && user) {
      return { token, user: JSON.parse(user), isAuthenticated: true };
    }
  } catch {}
  return { token: null, user: null, isAuthenticated: false };
}

const persisted = loadFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: persisted.user,
    token: persisted.token,
    isAuthenticated: persisted.isAuthenticated,
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.error = null;
      state.loading = false;
      localStorage.setItem('ll_token', token);
      localStorage.setItem('ll_user', JSON.stringify(user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      localStorage.removeItem('ll_token');
      localStorage.removeItem('ll_user');
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setCredentials, logout, setLoading, setError, clearError } =
  authSlice.actions;
export default authSlice.reducer;
