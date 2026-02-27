import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  generatePuzzle,
  getTodayDateString,
  getPuzzleTypeForDate,
} from '../engine/generator.js';
import { PUZZLE_LABELS, PUZZLE_DESCRIPTIONS } from '../utils/constants.js';
import { PuzzleIcon, CheckCircle, Flame } from '../components/Icons.jsx';

export default function Home() {
  const stats = useSelector((state) => state.stats);
  const { user } = useSelector((state) => state.auth);
  const todayDate = getTodayDateString();
  const puzzleType = getPuzzleTypeForDate(todayDate);
  const alreadySolved = stats.heatmapData[todayDate] > 0;

  return (
    <div>
      <motion.div
        className="home-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="home-hero-title">
          Welcome back,{' '}
          <span
            className="text-gradient"
            style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {user?.displayName || 'Logician'}
          </span>
        </h1>
        <p className="home-hero-subtitle">
          Train your logic daily. 5 rotating challenge types. 1 daily mystery.
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
            <div
              style={{
                fontSize: '1.2rem',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={20} strokeWidth={1.5} /> Challenge Complete
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Come back tomorrow for a new puzzle
            </p>
          </div>
        ) : (
          <Link to="/play" className="btn btn-primary btn-lg">
            Start Today's Challenge
          </Link>
        )}
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="home-quick-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="quick-stat">
          <div
            className="quick-stat-value"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
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
