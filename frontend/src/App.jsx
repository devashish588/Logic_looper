import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import store from './store/index.js';
import { loadStats, resetStats } from './store/statsSlice.js';
import { loadSettings } from './store/settingsSlice.js';
import { resetGame } from './store/gameSlice.js';
import { logout } from './store/authSlice.js';
import { loadAllState, saveAllState } from './storage/db.js';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Stats from './pages/Stats.jsx';
import Achievements from './pages/Achievements.jsx';
import Settings from './pages/Settings.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Logo from './components/Logo.jsx';
import {
    Home as HomeIcon,
    Gamepad2,
    BarChart3,
    Award,
    Settings as SettingsIcon,
    LogOut,
} from './components/Icons.jsx';

// Expose store globally for persistence from Play page
window.__REDUX_STORE__ = store;

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useSelector(state => state.auth);
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    return children;
}

function AppContent() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const location = useLocation();
    const isAuthRoute = location.pathname === '/auth';
    const userId = user?.id;

    // On user change: reset everything first, then load user-scoped data
    useEffect(() => {
        // Reset all state to defaults immediately (clean slate)
        dispatch(resetStats());
        dispatch(resetGame());
        dispatch(loadSettings({ theme: 'dark', timerEnabled: true, soundEnabled: true }));

        if (!userId || !isAuthenticated) return;

        // Try to fetch stats from the backend first (source of truth)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = store.getState().auth.token;

        (async () => {
            let statsLoaded = false;

            // 1. Try backend first
            try {
                const res = await fetch(`${apiUrl}/stats/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const serverStats = await res.json();
                    if (serverStats && serverStats.totalSolved > 0) {
                        dispatch(loadStats(serverStats));
                        statsLoaded = true;
                    }
                }
            } catch (e) {
                console.warn('Backend stats fetch failed (offline?):', e);
            }

            // 2. Fall back to user-scoped IndexedDB
            if (!statsLoaded) {
                try {
                    const saved = await loadAllState(userId);
                    if (saved.stats) dispatch(loadStats(saved.stats));
                    if (saved.settings) dispatch(loadSettings(saved.settings));
                } catch (e) {
                    console.warn('Failed to load saved state from IndexedDB:', e);
                }
            } else {
                // Still load user-scoped settings from IndexedDB
                try {
                    const saved = await loadAllState(userId);
                    if (saved.settings) dispatch(loadSettings(saved.settings));
                } catch { }
            }
        })();
    }, [userId, isAuthenticated, dispatch]);

    // Auto-save on changes — scoped to current user
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            const state = store.getState();
            const currentUserId = state.auth.user?.id;
            if (currentUserId && state.auth.isAuthenticated) {
                saveAllState(currentUserId, state.stats, state.settings).catch(() => { });
            }
        });
        return unsubscribe;
    }, []);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    function handleLogout() {
        // 1. Reset ALL Redux state to defaults — clean slate for next user
        dispatch(resetStats());
        dispatch(resetGame());
        dispatch(loadSettings({ theme: 'dark', timerEnabled: true, soundEnabled: true }));
        // 2. Clear auth (removes token + user from localStorage)
        dispatch(logout());
    }

    function getUserInitial() {
        if (!user) return '?';
        const name = user.displayName || user.email || '';
        return name.charAt(0).toUpperCase();
    }

    return (
        <div className="app-container">
            {/* Header — hidden on auth page */}
            {!isAuthRoute && (
                <header className="header">
                    <NavLink to="/" className="header-logo">
                        <span className="header-logo-icon"><Logo size={28} /></span>
                        <span className="header-logo-text">Logic Looper</span>
                    </NavLink>
                    <nav className="header-nav">
                        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                            <span className="nav-icon"><HomeIcon size={18} strokeWidth={1.5} /></span>
                            <span>Home</span>
                        </NavLink>
                        <NavLink to="/play" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><Gamepad2 size={18} strokeWidth={1.5} /></span>
                            <span>Play</span>
                        </NavLink>
                        <NavLink to="/stats" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><BarChart3 size={18} strokeWidth={1.5} /></span>
                            <span>Stats</span>
                        </NavLink>
                        <NavLink to="/achievements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><Award size={18} strokeWidth={1.5} /></span>
                            <span>Badges</span>
                        </NavLink>
                        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><SettingsIcon size={18} strokeWidth={1.5} /></span>
                            <span>Settings</span>
                        </NavLink>
                    </nav>
                    {isAuthenticated && user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="user-pill">
                                <div className="user-avatar">{getUserInitial()}</div>
                                <span className="user-name">{user.displayName || user.email}</span>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                <LogOut size={14} strokeWidth={1.5} />
                                Logout
                            </button>
                        </div>
                    )}
                </header>
            )}

            {/* Main Content */}
            <main className="main-content">
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/play" element={<ProtectedRoute><Play /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </Provider>
    );
}
