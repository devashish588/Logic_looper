import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { getTodayDateString, getPuzzleTypeForDate } from '../engine/generator.js';
import { PUZZLE_TYPES, PUZZLE_LABELS, PUZZLE_DESCRIPTIONS } from '../utils/constants.js';
import { PuzzleIcon, CheckCircle, Flame, Snowflake, CalendarDays, Dices, WifiOff } from '../components/Icons.jsx';
import NextPuzzleCountdown from '../components/NextPuzzleCountdown.jsx';

/**
 * Shows the "Local Mode" badge when the browser is offline. Progress is loaded once for the whole app
 * (see App.jsx), so this page only reads it from the store. Solves are saved on this device either way
 * and backed up as soon as the connection is back.
 */
function useOnlineStatus() {
    const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
    useEffect(() => {
        const up = () => setOnline(true);
        const down = () => setOnline(false);
        window.addEventListener('online', up);
        window.addEventListener('offline', down);
        return () => {
            window.removeEventListener('online', up);
            window.removeEventListener('offline', down);
        };
    }, []);
    return online;
}

export default function Home() {
    const stats = useSelector(state => state.stats);
    const isOffline = !useOnlineStatus();
    const todayDate = getTodayDateString();
    const puzzleType = getPuzzleTypeForDate(todayDate);
    const todaysEntry = stats.history[todayDate];
    const alreadySolved = Boolean(todaysEntry);
    const streakAtRisk = stats.hydrated && !alreadySolved && stats.currentStreak > 0;
    // A freeze covered a missed day in the last couple of days: tell the player.
    const recentFreeze = [...stats.frozenDates].reverse()
        .find(d => dayjs(todayDate).diff(dayjs(d), 'day') <= 2);

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
                    {PUZZLE_TYPES.length} different puzzle types. One new challenge every day. Keep the streak alive.
                </p>
            </motion.div>

            {recentFreeze && stats.currentStreak > 0 && (
                <div className="freeze-banner" role="status">
                    <Snowflake size={18} strokeWidth={1.5} />
                    <span>
                        A streak freeze covered {dayjs(recentFreeze).format('dddd, MMM D')} and saved
                        your {stats.currentStreak}-day streak.
                    </span>
                </div>
            )}

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

                {!stats.hydrated ? (
                    <p className="text-muted">Loading your progress…</p>
                ) : alreadySolved ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <CheckCircle size={20} strokeWidth={1.5} /> Challenge Complete · {todaysEntry.points} pts
                        </div>
                        <NextPuzzleCountdown />
                        <Link to="/practice" className="btn btn-secondary" style={{ marginTop: '12px' }}>
                            <CalendarDays size={16} strokeWidth={1.5} /> Practice past puzzles
                        </Link>
                    </div>
                ) : (
                    <>
                        {streakAtRisk && (
                            <p className="streak-risk">
                                <Flame size={16} strokeWidth={1.5} />
                                Solve today to keep your {stats.currentStreak}-day streak
                            </p>
                        )}
                        <Link to="/play" className="btn btn-primary btn-lg">
                            Start Today's Challenge
                        </Link>
                    </>
                )}
            </motion.div>

            <Link to="/free" className="home-free-link">
                <Dices size={18} strokeWidth={1.5} />
                <span>
                    <strong>Free Play</strong>
                    <span className="text-muted"> · {PUZZLE_TYPES.length} games, unlimited puzzles, any difficulty</span>
                </span>
            </Link>

            {/* Quick Stats */}
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
                <div
                    className="quick-stat"
                    title={stats.nextFreezeIn
                        ? `Next freeze in ${stats.nextFreezeIn} solve${stats.nextFreezeIn === 1 ? '' : 's'}`
                        : 'Freeze bank full'}
                >
                    <div className="quick-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Snowflake size={20} strokeWidth={1.5} /> {stats.freezesAvailable}/2
                    </div>
                    <div className="quick-stat-label">Streak Freezes</div>
                </div>
            </motion.div>
        </div>
    );
}
