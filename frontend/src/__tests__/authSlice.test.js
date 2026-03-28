/**
 * Tests for store/authSlice.js — Redux auth state management.
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] ?? null),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import authReducer, {
    setCredentials,
    logout,
    setLoading,
    setError,
    clearError,
} from '../store/authSlice.js';

describe('authSlice', () => {
    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
    });

    const emptyAuthState = {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
    };

    describe('initial state', () => {
        it('loads empty state when localStorage is empty', () => {
            // Since module was already loaded, we test the reducer directly
            const state = authReducer(emptyAuthState, { type: '@@INIT' });
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });

    describe('setCredentials', () => {
        it('sets user, token, and isAuthenticated', () => {
            const user = { id: '1', displayName: 'Test User', email: 'test@example.com' };
            const state = authReducer(
                emptyAuthState,
                setCredentials({ token: 'jwt-token', user }),
            );
            expect(state.user).toEqual(user);
            expect(state.token).toBe('jwt-token');
            expect(state.isAuthenticated).toBe(true);
            expect(state.error).toBeNull();
            expect(state.loading).toBe(false);
        });

        it('persists to localStorage', () => {
            const user = { id: '1', displayName: 'Test' };
            authReducer(
                emptyAuthState,
                setCredentials({ token: 'tok', user }),
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith('ll_token', 'tok');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'll_user',
                JSON.stringify(user),
            );
        });

        it('clears previous error', () => {
            const errorState = { ...emptyAuthState, error: 'some error' };
            const state = authReducer(
                errorState,
                setCredentials({ token: 'tok', user: { id: '1' } }),
            );
            expect(state.error).toBeNull();
        });
    });

    describe('logout', () => {
        it('clears user, token, and isAuthenticated', () => {
            const loggedIn = {
                ...emptyAuthState,
                user: { id: '1' },
                token: 'tok',
                isAuthenticated: true,
            };
            const state = authReducer(loggedIn, logout());
            expect(state.user).toBeNull();
            expect(state.token).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });

        it('removes from localStorage', () => {
            const loggedIn = {
                ...emptyAuthState,
                user: { id: '1' },
                token: 'tok',
                isAuthenticated: true,
            };
            authReducer(loggedIn, logout());
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('ll_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('ll_user');
        });
    });

    describe('setLoading', () => {
        it('sets loading to true', () => {
            const state = authReducer(emptyAuthState, setLoading(true));
            expect(state.loading).toBe(true);
        });

        it('sets loading to false', () => {
            const state = authReducer(
                { ...emptyAuthState, loading: true },
                setLoading(false),
            );
            expect(state.loading).toBe(false);
        });
    });

    describe('setError', () => {
        it('sets error and clears loading', () => {
            const state = authReducer(
                { ...emptyAuthState, loading: true },
                setError('Login failed'),
            );
            expect(state.error).toBe('Login failed');
            expect(state.loading).toBe(false);
        });
    });

    describe('clearError', () => {
        it('clears error', () => {
            const state = authReducer(
                { ...emptyAuthState, error: 'some error' },
                clearError(),
            );
            expect(state.error).toBeNull();
        });
    });
});
