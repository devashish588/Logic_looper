import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toggleTheme, toggleTimer, toggleSound } from '../store/settingsSlice.js';
import { setHistory, setSyncStatus } from '../store/statsSlice.js';
import { resetGame } from '../store/gameSlice.js';
import { clearLegacyStats } from '../storage/db.js';
import { clearDailyActivity } from '../storage/activityStore.js';
import { deleteServerProgress } from '../utils/syncManager.js';
import { PUZZLE_TYPES } from '../utils/constants.js';
import {
    Settings as SettingsIcon,
    Moon,
    Clock,
    Volume2,
    AlertTriangle,
    Info,
} from '../components/Icons.jsx';

export default function Settings() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const { user, token } = useSelector(state => state.auth);
    const [resetError, setResetError] = useState(null);
    const [resetting, setResetting] = useState(false);

    // Settings are persisted per user by App whenever they change.
    const handleToggle = (action) => dispatch(action());

    // Before v1.1 this only cleared the screen; the data came back on reload.
    // Now it deletes progress on the server first, then on this device.
    const handleReset = async () => {
        if (!confirm('Reset all progress? This deletes your streaks, history and badges on every device. It cannot be undone.')) return;
        setResetting(true);
        setResetError(null);
        try {
            await deleteServerProgress(token);
            await clearDailyActivity(user.id);
            await clearLegacyStats(user.id);
            dispatch(resetGame());
            dispatch(setHistory({ entries: [], achievements: [] }));
            dispatch(setSyncStatus('synced'));
        } catch {
            setResetError('Could not reach the server, so nothing was deleted. Try again when you are online.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div>
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">
                    <SettingsIcon size={24} strokeWidth={1.5} /> Preferences
                </h1>
                <p className="page-subtitle">Customize your experience</p>
            </motion.div>

            <div className="settings-list">
                <motion.div
                    className="settings-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <div className="settings-label">
                        <span className="settings-title">
                            <Moon size={16} strokeWidth={1.5} /> Dark Mode
                        </span>
                        <span className="settings-desc">Toggle between dark and light themes</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.theme === 'dark'}
                            onChange={() => handleToggle(toggleTheme)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </motion.div>

                <motion.div
                    className="settings-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="settings-label">
                        <span className="settings-title">
                            <Clock size={16} strokeWidth={1.5} /> Timer
                        </span>
                        <span className="settings-desc">Show the puzzle timer</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.timerEnabled}
                            onChange={() => handleToggle(toggleTimer)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </motion.div>

                <motion.div
                    className="settings-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="settings-label">
                        <span className="settings-title">
                            <Volume2 size={16} strokeWidth={1.5} /> Sound Effects
                        </span>
                        <span className="settings-desc">Play sounds on interactions</span>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.soundEnabled}
                            onChange={() => handleToggle(toggleSound)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </motion.div>
            </div>

            {/* Danger Zone */}
            <motion.div
                className="section mt-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="section-title" style={{ color: 'var(--accent-danger)' }}>
                    <AlertTriangle size={18} strokeWidth={1.5} /> Danger Zone
                </div>
                <div className="card" style={{ borderColor: 'rgba(230, 90, 90, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Reset All Progress</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Delete all stats, streaks, and achievements</div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={handleReset} disabled={resetting}>
                            {resetting ? 'Resetting…' : 'Reset'}
                        </button>
                    </div>
                    {resetError && <p className="play-notice" style={{ marginTop: '12px' }}>{resetError}</p>}
                </div>
            </motion.div>

            {/* About */}
            <motion.div
                className="section mt-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className="section-title">
                    <Info size={18} strokeWidth={1.5} /> About
                </div>
                <div className="card">
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <strong>Logic Looper</strong> — A daily puzzle game with {PUZZLE_TYPES.length} puzzle types. Sharpen
                        your reasoning with Number Matrices, Sequence Solving, Deduction Grids, Binary Logic
                        circuits, Switchboards, Laser Paths, Measuring jugs, Balance Scales, Pixel Logic,
                        Number Trails and a daily word, Letter Lock.
                    </p>
                    <p className="text-muted mt-8" style={{ fontSize: '0.8rem' }}>
                        Version 1.4.0 • Built with React + Vite
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
