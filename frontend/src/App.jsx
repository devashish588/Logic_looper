import React, { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './store/index.js';
import { loadStats, resetStats } from './store/statsSlice.js';
import { loadSettings } from './store/settingsSlice.js';
import { resetGame } from './store/gameSlice.js';
import { logout } from './store/authSlice.js';
import { loadAllState, saveAllState } from './storage/db.js';
import { fetchAggregatedStats, syncDailyActivity } from './utils/syncManager.js';
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

window.__REDUX_STORE__ = store;

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useSelector(state => state.auth);
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    return children;
}

/* ─── Navigation Items ─── */
const NAV_ITEMS = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/play', icon: Gamepad2, label: 'Play' },
    { to: '/stats', icon: BarChart3, label: 'Stats' },
    { to: '/achievements', icon: Award, label: 'Badges' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

/**
 * Hydration Hook — runs immediately after login.
 * 1. Fetches aggregated stats from backend (single source of truth)
 * 2. Falls back to local IndexedDB if offline
 * 3. Syncs any unsynced local entries
 * 4. Populates Redux + IndexedDB
 */
function useHydration(userId, token, isAuthenticated) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!userId || !isAuthenticated || !token) {
            dispatch(resetStats());
            dispatch(resetGame());
            dispatch(loadSettings({ theme: 'dark', timerEnabled: true, soundEnabled: true }));
            return;
        }

        let cancelled = false;

        async function hydrate() {
            // Load settings from IndexedDB (always local)
            try {
                const saved = await loadAllState(userId);
                if (saved.settings && !cancelled) {
                    dispatch(loadSettings(saved.settings));
                }
            } catch { }

            // 1. Try fetching aggregated stats from backend
            let statsLoaded = false;
            if (navigator.onLine) {
                try {
                    const serverStats = await fetchAggregatedStats(userId, token);
                    if (serverStats && serverStats.totalSolved > 0 && !cancelled) {
                        dispatch(loadStats(serverStats));
                        await saveAllState(userId, serverStats, store.getState().settings);
                        statsLoaded = true;
                    }
                } catch { }
            }

            // 2. Fallback to local IndexedDB if backend failed
            if (!statsLoaded && !cancelled) {
                try {
                    const saved = await loadAllState(userId);
                    if (saved.stats && saved.stats.totalSolved > 0) {
                        dispatch(loadStats(saved.stats));
                        statsLoaded = true;
                    }
                } catch { }
            }

            // 3. Sync any unsynced local activity entries
            if (!cancelled) {
                try {
                    const syncResult = await syncDailyActivity(userId, token);
                    if (syncResult?.stats && syncResult.stats.totalSolved > 0) {
                        dispatch(loadStats(syncResult.stats));
                        await saveAllState(userId, syncResult.stats, store.getState().settings);
                    }
                } catch { }
            }
        }

        hydrate();

        return () => { cancelled = true; };
    }, [userId, isAuthenticated, token, dispatch]);

    // Auto-save on Redux changes
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
}

function AppContent() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const { isAuthenticated, user, token } = useSelector(state => state.auth);
    const location = useLocation();
    const isAuthRoute = location.pathname === '/auth';
    const isPlayRoute = location.pathname === '/play';
    const userId = user?.id;

    // Hydration hook — silently fetches stats in background
    useHydration(userId, token, isAuthenticated);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    function handleLogout() {
        dispatch(resetStats());
        dispatch(resetGame());
        dispatch(loadSettings({ theme: 'dark', timerEnabled: true, soundEnabled: true }));
        dispatch(logout());
    }

    function getUserInitial() {
        if (!user) return '?';
        const name = user.displayName || user.email || '';
        return name.charAt(0).toUpperCase();
    }

    const game = useSelector(state => state.game);
    const hideNav = isAuthRoute || (isPlayRoute && game.currentPuzzle && !game.showResult);

    return (
        <div className="app-container">
            {/* ─── Desktop Top Header ─── */}
            {!isAuthRoute && (
                <header className="header-desktop">
                    <NavLink to="/" className="header-logo">
                        <span className="header-logo-icon"><Logo size={28} /></span>
                        <span className="header-logo-text">Logic Looper</span>
                    </NavLink>
                    <nav className="header-nav-desktop">
                        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-link-desktop ${isActive ? 'active' : ''}`}
                                end={to === '/'}
                            >
                                <Icon size={18} strokeWidth={1.5} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>
                    {isAuthenticated && user && (
                        <div className="header-user">
                            <div className="user-pill">
                                <div className="user-avatar">{getUserInitial()}</div>
                                <span className="user-name">{user.displayName || user.email}</span>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                <LogOut size={14} strokeWidth={1.5} /> Logout
                            </button>
                        </div>
                    )}
                </header>
            )}

            {/* ─── Main Content ─── */}
            <main className={`main-content ${hideNav ? 'main-immersive' : ''}`}>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/play" element={<ProtectedRoute><Play /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
            </main>

            {/* ─── Mobile Bottom Tab Bar ─── */}
            {!hideNav && (
                <nav className="bottom-tab-bar">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
                            end={to === '/'}
                        >
                            <Icon size={22} strokeWidth={1.8} />
                            <span className="tab-label">{label}</span>
                        </NavLink>
                    ))}
                </nav>
            )}
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
