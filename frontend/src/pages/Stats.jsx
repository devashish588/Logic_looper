import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import {
    BarChart3,
    Flame,
    Trophy,
    CheckCircle,
    Gem,
    Clock,
    Zap,
    Star,
    Calendar,
} from '../components/Icons.jsx';

function Heatmap({ data }) {
    const cells = useMemo(() => {
        const today = dayjs();
        const result = [];
        for (let i = 364; i >= 0; i--) {
            const date = today.subtract(i, 'day').format('YYYY-MM-DD');
            const score = data[date] || 0;
            let level = 0;
            if (score > 0) level = 1;
            if (score >= 50) level = 2;
            if (score >= 80) level = 3;
            if (score >= 100) level = 4;
            result.push({ date, score, level });
        }
        return result;
    }, [data]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="heatmap-container">
            <div className="heatmap-grid">
                {cells.map((cell, i) => (
                    <div
                        key={i}
                        className={`heatmap-cell heatmap-level-${cell.level}`}
                        title={`${cell.date}: ${cell.score} pts`}
                    />
                ))}
            </div>
            <div className="heatmap-months">
                {months.map(m => <span key={m}>{m}</span>)}
            </div>
        </div>
    );
}

export default function Stats() {
    const stats = useSelector(state => state.stats);

    const formatTime = (s) => {
        if (!s) return '—';
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">
                    <BarChart3 size={24} strokeWidth={1.5} /> Statistics
                </h1>
                <p className="page-subtitle">Your Logic Looper journey</p>
            </motion.div>

            {/* Streak Display */}
            <motion.div
                className="card"
                style={{ marginBottom: '24px', textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="streak-display" style={{ justifyContent: 'center' }}>
                    {stats.currentStreak > 0 && (
                        <span className="streak-flame">
                            <Flame size={32} strokeWidth={1.5} />
                        </span>
                    )}
                    <div>
                        <div className="streak-number">{stats.currentStreak}</div>
                        <div className="streak-label">Day Streak</div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                className="stats-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="stat-card">
                    <div className="stat-card-icon"><Trophy size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.longestStreak}</div>
                    <div className="stat-card-label">Best Streak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><CheckCircle size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.totalSolved}</div>
                    <div className="stat-card-label">Puzzles Solved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><Gem size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.totalPoints}</div>
                    <div className="stat-card-label">Total Points</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><Clock size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{formatTime(stats.averageTime)}</div>
                    <div className="stat-card-label">Avg Time</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><Zap size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{formatTime(stats.fastestSolve)}</div>
                    <div className="stat-card-label">Fastest Solve</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><Star size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.solvedTypes.length}/5</div>
                    <div className="stat-card-label">Types Mastered</div>
                </div>
            </motion.div>

            {/* Heatmap */}
            <motion.div
                className="section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="section-title">
                    <Calendar size={18} strokeWidth={1.5} /> Activity
                </div>
                <div className="card">
                    <Heatmap data={stats.heatmapData} />
                </div>
            </motion.div>
        </div>
    );
}
