import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePuzzle, getTodayDateString, getPuzzleTypeForDate } from '../engine/generator.js';
import { PUZZLE_LABELS, PUZZLE_DESCRIPTIONS } from '../utils/constants.js';
import { PuzzleIcon, CheckCircle, Flame, Gem, Trophy, Zap, WifiOff } from '../components/Icons.jsx';
import { fetchAggregatedStats } from '../utils/syncManager.js';
import { loadStats } from '../store/statsSlice.js';
import { saveAllState, loadAllState } from '../storage/db.js';

/**
 * useDashboardData — Unified data hook
 *
 * Priority order:
 * 1. Current Redux state (always shown immediately — may have local recordSolve data)
 * 2. IndexedDB local cache (loaded on mount for offline support)
 * 3. Backend aggregated stats (fetched if online — merged only if richer)
 *
 * Never overwrites local data with empty/less-complete backend data.
 */
function useDashboardData() {
    const dispatch = useDispatch();
    const { user, token, isAuthenticated } = useSelector(s => s.auth);
    const reduxStats = useSelector(s => s.stats);
    const userId = user?.id;

    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Online/offline detection
    useEffect(() => {
        const goOnline = () => setIsOffline(false);
        const goOffline = () => setIsOffline(true);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    // Load data: IndexedDB first, then backend merge
    useEffect(() => {
        if (!userId || !isAuthenticated) return;
        let cancelled = false;

        async function loadData() {
            // 1. Try loading from IndexedDB (instant, works offline)
            try {
                const saved = await loadAllState(userId);
                if (saved.stats && saved.stats.totalSolved > 0 && !cancelled) {
                    // Only merge if local IndexedDB has more data than current Redux
                    const current = window.__REDUX_STORE__?.getState()?.stats;
                    if (!current || saved.stats.totalSolved >= (current.totalSolved || 0)) {
                        dispatch(loadStats(saved.stats));
                    }
                }
            } catch { }

            // 2. Try fetching from backend (if online)
            if (navigator.onLine && token) {
                try {
                    const serverStats = await fetchAggregatedStats(userId, token);
                    if (serverStats && !cancelled) {
                        const current = window.__REDUX_STORE__?.getState()?.stats;
                        // Only use server data if it has MORE or EQUAL solved count
                        // This prevents overwriting local solves that haven't synced yet
                        if (serverStats.totalSolved >= (current?.totalSolved || 0)) {
                            dispatch(loadStats(serverStats));
                            await saveAllState(userId, serverStats, window.__REDUX_STORE__?.getState()?.settings);
                        }
                    }
                } catch (err) {
                    console.warn('Backend fetch failed (using local data):', err);
                }
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, [userId, isAuthenticated, token, dispatch]);

    return {
        stats: reduxStats,
        isOffline,
    };
}

export default function Home() {
    const { stats, isOffline } = useDashboardData();
    const todayDate = getTodayDateString();
    const puzzleType = getPuzzleTypeForDate(todayDate);
    const alreadySolved = stats.heatmapData?.[todayDate] > 0;

    return (
        <div>
            {/* Offline badge */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        className="offline-badge"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <WifiOff size={14} strokeWidth={2} />
                        <span>Local Mode — data will sync when online</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="home-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="home-hero-title">
                    Train Your <span className="text-gradient">Logic</span> Daily
                </h1>
                <p className="home-hero-subtitle">
                    5 rotating puzzle types. One new challenge every day. Keep the streak alive.
                </p>
            </motion.div>

            <motion.div
                className="home-today-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
            >
                <motion.div
                    className="home-puzzle-type"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <PuzzleIcon type={puzzleType} size={48} />
                </motion.div>
                <span className="badge badge-type">Today's Challenge</span>
                <div className="home-puzzle-name">{PUZZLE_LABELS[puzzleType]}</div>
                <p className="home-puzzle-desc">{PUZZLE_DESCRIPTIONS[puzzleType]}</p>

                {alreadySolved ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CheckCircle size={20} strokeWidth={1.5} /> Challenge Complete
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Come back tomorrow for a new puzzle</p>
                    </div>
                ) : (
                    <Link to="/play" className="btn btn-primary btn-lg">
                        Start Today's Challenge
                    </Link>
                )}
            </motion.div>

            {/* Quick Stats — always shows current Redux values */}
            <motion.div
                className="home-quick-stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="quick-stat">
                    <div className="quick-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {stats.currentStreak > 0 && <Flame size={20} strokeWidth={1.5} />}
                        {stats.currentStreak}
                    </div>
                    <div className="quick-stat-label">Current Streak</div>
                </div>
                <div className="quick-stat">
                    <div className="quick-stat-value">{stats.totalSolved}</div>
                    <div className="quick-stat-label">Puzzles Solved</div>
                </div>
                <div className="quick-stat">
                    <div className="quick-stat-value">{stats.totalPoints}</div>
                    <div className="quick-stat-label">Total Points</div>
                </div>
                <div className="quick-stat">
                    <div className="quick-stat-value">{stats.longestStreak}</div>
                    <div className="quick-stat-label">Best Streak</div>
                </div>
            </motion.div>
        </div>
    );
}
