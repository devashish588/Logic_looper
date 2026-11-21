import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './store/index.js';
import { setHistory, resetStats, refreshDerived, setSyncStatus } from './store/statsSlice.js';
import { loadSettings as applySettings } from './store/settingsSlice.js';
import { resetGame } from './store/gameSlice.js';
import { logout, sessionExpired } from './store/authSlice.js';
import { loadSettings, saveSettings, requestPersistentStorage } from './storage/db.js';
import { hydrateUserProgress, syncDailyActivity } from './utils/syncManager.js';
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Stats from './pages/Stats.jsx';
import Achievements from './pages/Achievements.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Archive from './pages/Archive.jsx';
import FreePlay from './pages/FreePlay.jsx';
import Settings from './pages/Settings.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Logo from './components/Logo.jsx';
import {
    Home as HomeIcon,
    Gamepad2,
    BarChart3,
    Award,
    Medal,
    Settings as SettingsIcon,
    LogOut,
    Cloud,
    CloudOff,
} from './components/Icons.jsx';

window.__REDUX_STORE__ = store;

const DEFAULT_SETTINGS = { theme: 'dark', timerEnabled: true, soundEnabled: true };

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
    { to: '/leaderboard', icon: Medal, label: 'Ranks' },
    { to: '/achievements', icon: Award, label: 'Badges' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

/**
 * Loads the signed-in player's progress, once per login.
 *
 * Progress is the list of days they solved. It is merged from the server, this device and any older
 * saved data (see hydrateUserProgress), and everything else (streak, heatmap, totals, badges) is
 * derived from it. Only Redux is reset on user change; nothing is ever written over saved progress,
 * which is what used to wipe a player's streak on logout/login.
 */
function useHydration(userId, isAuthenticated) {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);

    // The user whose settings are loaded, so we never save one user's defaults over another's.
    const settingsOwnerRef = useRef(null);

    useEffect(() => {
        settingsOwnerRef.current = null;
        dispatch(resetStats());
        dispatch(resetGame());
        dispatch(applySettings(DEFAULT_SETTINGS));

        if (!userId || !isAuthenticated) return;

        let cancelled = false;
        (async () => {
            requestPersistentStorage();

            try {
                const saved = await loadSettings(userId);
                if (!cancelled && saved) dispatch(applySettings(saved));
            } catch { /* defaults are fine */ }
            if (!cancelled) settingsOwnerRef.current = userId;

            dispatch(setSyncStatus('syncing'));
            let result;
            try {
                result = await hydrateUserProgress(userId, store.getState().auth.token);
            } catch (err) {
                // Never leave the app stuck on "Loading": show what we have (nothing) and flag that
                // backup isn't confirmed. Saved data is untouched.
                console.error('Could not load progress:', err);
                result = { entries: [], achievements: [], status: 'error', recoveredCount: 0 };
            }
            if (cancelled) return;

            dispatch(setHistory(result));
            dispatch(setSyncStatus(result.status)); // 'unauthorized' → handled in AppContent
        })();

        return () => { cancelled = true; };
    }, [userId, isAuthenticated, dispatch]);

    // Persist settings when they change (only once this user's settings are loaded)
    useEffect(() => {
        if (userId && settingsOwnerRef.current === userId) {
            saveSettings(userId, settings).catch(() => { });
        }
    }, [settings, userId]);
}

function SyncIndicator() {
    const { syncStatus, lastSyncedAt } = useSelector(state => state.stats);
    if (syncStatus === 'idle' || syncStatus === 'unauthorized') return null;

    const labels = {
        syncing: 'Saving…',
        synced: 'Backed up',
        offline: 'Offline: saved on this device',
        error: 'Not backed up yet',
    };
    const ok = syncStatus === 'synced' || syncStatus === 'syncing';
    return (
        <span
            className={`sync-pill ${ok ? '' : 'warn'}`}
            title={lastSyncedAt ? `Last backup: ${new Date(lastSyncedAt).toLocaleString()}` : labels[syncStatus]}
        >
            {ok ? <Cloud size={14} strokeWidth={1.5} /> : <CloudOff size={14} strokeWidth={1.5} />}
            <span className="sync-pill-text">{labels[syncStatus]}</span>
        </span>
    );
}

function AppContent() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const { isAuthenticated, user, token } = useSelector(state => state.auth);
    const syncStatus = useSelector(state => state.stats.syncStatus);
    const game = useSelector(state => state.game);
    const location = useLocation();
    const path = location.pathname;
    const isAuthRoute = path === '/auth';
    // A puzzle screen: today's, a past day's (practice) or a Free Play puzzle
    const isPlayRoute = path === '/play' || path.startsWith('/practice/') || path.startsWith('/free/');
    const userId = user?.id;

    // Loads this player's progress in the background
    useHydration(userId, isAuthenticated);

    // Retry backup when connectivity returns; refresh the streak when the tab regains focus
    // (it may have become a new day).
    useEffect(() => {
        const onOnline = async () => {
            const { auth } = store.getState();
            if (!auth.user?.id || !auth.token) return;
            dispatch(setSyncStatus('syncing'));
            dispatch(setSyncStatus(await syncDailyActivity(auth.user.id, auth.token)));
        };
        const onOffline = () => dispatch(setSyncStatus('offline'));
        const onVisible = () => {
            if (document.visibilityState === 'visible') dispatch(refreshDerived());
        };
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [dispatch]);

    // Expired/invalid token (from load or from a sync after solving): send the player to log in
    // again. Their progress stays on this device and is uploaded after they sign back in.
    useEffect(() => {
        if (syncStatus === 'unauthorized' && token) dispatch(sessionExpired());
    }, [syncStatus, token, dispatch]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    function handleLogout() {
        // Progress stays in IndexedDB (keyed by user id) and on the server; logging out only
        // clears what's in memory.
        dispatch(logout());
    }

    function getUserInitial() {
        if (!user) return '?';
        const name = user.displayName || user.email || '';
        return name.charAt(0).toUpperCase();
    }

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
                            <SyncIndicator />
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
                    <Route path="/practice" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
                    <Route path="/practice/:date" element={<ProtectedRoute><Play /></ProtectedRoute>} />
                    <Route path="/free" element={<ProtectedRoute><FreePlay /></ProtectedRoute>} />
                    <Route path="/free/:type/:level/:seed" element={<ProtectedRoute><Play /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
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
