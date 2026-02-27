import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  toggleTheme,
  toggleTimer,
  toggleSound,
} from '../store/settingsSlice.js';
import { resetStats } from '../store/statsSlice.js';
import { saveState } from '../storage/db.js';
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
  const settings = useSelector((state) => state.settings);

  const handleToggle = (action) => {
    dispatch(action());
    setTimeout(async () => {
      const state = window.__REDUX_STORE__?.getState();
      if (state) await saveState('settings', state.settings);
    }, 100);
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all progress? This cannot be undone.',
      )
    ) {
      dispatch(resetStats());
      saveState('stats', null);
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
            <span className="settings-desc">
              Toggle between dark and light themes
            </span>
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
        <div
          className="section-title"
          style={{ color: 'var(--accent-danger)' }}
        >
          <AlertTriangle size={18} strokeWidth={1.5} /> Danger Zone
        </div>
        <div className="card" style={{ borderColor: 'rgba(230, 90, 90, 0.2)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Reset All Progress
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Delete all stats, streaks, and achievements
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleReset}>
              Reset
            </button>
          </div>
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
            <strong>Logic Looper</strong> — A daily puzzle game with 5 rotating
            logic challenge types. Sharpen your reasoning with Number Matrices,
            Pattern Matching, Sequence Solving, Deduction Grids, and Binary
            Logic circuits.
          </p>
          <p className="text-muted mt-8" style={{ fontSize: '0.8rem' }}>
            Version 1.0.0 • Built with React + Vite
          </p>
        </div>
      </motion.div>
    </div>
  );
}
