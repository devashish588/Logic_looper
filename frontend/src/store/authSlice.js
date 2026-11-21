import { createSlice } from '@reduxjs/toolkit';

// Hydrate from localStorage on load
function loadFromStorage() {
    try {
        const token = localStorage.getItem('ll_token');
        const user = localStorage.getItem('ll_user');
        if (token && user) {
            return { token, user: JSON.parse(user), isAuthenticated: true };
        }
    } catch { }
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
        notice: null,   // informational message on the login page (e.g. session expired)
    },
    reducers: {
        setCredentials(state, action) {
            const { token, user } = action.payload;
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
            state.error = null;
            state.notice = null;
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
        /**
         * Token rejected by the server. Signs out but keeps a message for the
         * login page. Local progress is keyed by user id and is NOT deleted; it
         * is merged and uploaded on the next login.
         */
        sessionExpired(state) {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.notice = 'Your session expired. Log in again to back up your progress; nothing on this device was lost.';
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

export const { setCredentials, logout, sessionExpired, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
