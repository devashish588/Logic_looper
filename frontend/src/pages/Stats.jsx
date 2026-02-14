import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import HeatmapCell from '../components/HeatmapCell.jsx';
import { getDailyActivity } from '../storage/activityStore.js';
import { calculateStreaks } from '../utils/streakCalculator.js';
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

/**
 * Build a GitHub-style 7-row × N-column grid from activity data.
 * Row = day-of-week (0=Sun … 6=Sat), Column = week index.
 */
function buildHeatmapGrid(activityMap) {
    const today = dayjs();
    const cells = [];

    for (let i = 364; i >= 0; i--) {
        const d = today.subtract(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const entry = activityMap[dateStr];

        cells.push({
            date: dateStr,
            dayOfWeek: d.day(), // 0=Sun
            score: entry?.score || 0,
            intensity: entry?.intensity || 0,
            puzzleType: entry?.puzzleType || '',
            isToday: i === 0,
        });
    }

    // Organize into weeks (columns)
    // The first cell might not be on Sunday, so we need padding.
    const firstDow = cells[0].dayOfWeek;
    const weeks = [];
    let currentWeek = new Array(firstDow).fill(null); // pad leading days

    for (const cell of cells) {
        currentWeek.push(cell);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    return weeks;
}

/**
 * Determine which month labels to show and at which column index.
 */
function buildMonthLabels(weeks) {
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, colIdx) => {
        // Find the first non-null cell in the week
        const firstCell = week.find(c => c !== null);
        if (!firstCell) return;
        const month = dayjs(firstCell.date).month();
        if (month !== lastMonth) {
            labels.push({
                month: dayjs(firstCell.date).format('MMM'),
                colIdx,
            });
            lastMonth = month;
        }
    });

    return labels;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LEGEND_LEVELS = [0, 1, 2, 3, 4];
const LEGEND_COLORS = {
    0: 'rgba(246, 231, 188, 0.4)',
    1: '#0992C2',
    2: '#0773A0',
    3: '#054F7E',
    4: '#0B2D72',
};

function Heatmap({ justSolved }) {
    const userId = useSelector(state => state.auth.user?.id);
    const reduxHeatmap = useSelector(state => state.stats.heatmapData);
    const [activityMap, setActivityMap] = useState({});

    // Load from IndexedDB, fall back to Redux heatmapData
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (userId) {
                try {
                    const entries = await getDailyActivity(userId);
                    if (!cancelled && entries.length > 0) {
                        const map = {};
                        for (const e of entries) {
                            map[e.date] = e;
                        }
                        setActivityMap(map);
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to load activity from IndexedDB:', e);
                }
            }
            // Fallback: build from Redux heatmapData
            if (!cancelled) {
                const map = {};
                for (const [date, score] of Object.entries(reduxHeatmap || {})) {
                    let intensity = 0;
                    if (score > 0) intensity = 1;
                    if (score >= 50) intensity = 2;
                    if (score >= 80) intensity = 3;
                    if (score >= 100) intensity = 4;
                    map[date] = { date, score, intensity, puzzleType: '', solved: score > 0 };
                }
                setActivityMap(map);
            }
        })();
        return () => { cancelled = true; };
    }, [userId, reduxHeatmap]);

    const weeks = useMemo(() => buildHeatmapGrid(activityMap), [activityMap]);
    const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

    return (
        <div className="heatmap-container">
            {/* Month labels */}
            <div className="heatmap-month-row" style={{ paddingLeft: '32px' }}>
                {monthLabels.map((ml, i) => (
                    <span
                        key={i}
                        className="heatmap-month-label"
                        style={{
                            gridColumnStart: ml.colIdx + 1,
                        }}
                    >
                        {ml.month}
                    </span>
                ))}
            </div>

            <div className="heatmap-body">
                {/* Day-of-week labels */}
                <div className="heatmap-day-labels">
                    {DAY_LABELS.map((label, i) => (
                        <span key={i} className="heatmap-day-label">
                            {i % 2 === 1 ? label : ''}
                        </span>
                    ))}
                </div>

                {/* Grid — 7 rows, auto columns */}
                <div
                    className="heatmap-grid"
                    style={{
                        gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                    }}
                >
                    {weeks.map((week, colIdx) =>
                        week.map((cell, rowIdx) =>
                            cell ? (
                                <HeatmapCell
                                    key={cell.date}
                                    date={cell.date}
                                    score={cell.score}
                                    intensity={cell.intensity}
                                    puzzleType={cell.puzzleType}
                                    isToday={cell.isToday}
                                    justSolved={justSolved}
                                />
                            ) : (
                                <div key={`pad-${colIdx}-${rowIdx}`} className="heatmap-cell-empty" />
                            )
                        )
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="heatmap-legend-text">Less</span>
                {LEGEND_LEVELS.map(level => (
                    <div
                        key={level}
                        className="heatmap-legend-cell"
                        style={{ backgroundColor: LEGEND_COLORS[level] }}
                    />
                ))}
                <span className="heatmap-legend-text">More</span>
            </div>
        </div>
    );
}

export default function Stats() {
    const stats = useSelector(state => state.stats);
    const userId = useSelector(state => state.auth.user?.id);
    const reduxHeatmap = useSelector(state => state.stats.heatmapData);
    const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });
    const [justSolved, setJustSolved] = useState(false);

    // Compute streaks from activity store
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (userId) {
                try {
                    const { getDailyActivity } = await import('../storage/activityStore.js');
                    const entries = await getDailyActivity(userId);
                    if (!cancelled && entries.length > 0) {
                        const { calculateStreaks } = await import('../utils/streakCalculator.js');
                        const result = calculateStreaks(entries);
                        setStreaks(result);
                        return;
                    }
                } catch (e) {
                    console.warn('Failed to compute streaks:', e);
                }
            }
            // Fallback to Redux state
            if (!cancelled) {
                setStreaks({
                    currentStreak: stats.currentStreak,
                    longestStreak: stats.longestStreak,
                });
            }
        })();
        return () => { cancelled = true; };
    }, [userId, stats.currentStreak, stats.longestStreak, reduxHeatmap]);

    // Check if today was just solved (for pulse animation)
    useEffect(() => {
        const today = dayjs().format('YYYY-MM-DD');
        if (reduxHeatmap[today] > 0) {
            setJustSolved(true);
            const timer = setTimeout(() => setJustSolved(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [reduxHeatmap]);

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
                    {streaks.currentStreak > 0 && (
                        <span className="streak-flame">
                            <Flame size={32} strokeWidth={1.5} />
                        </span>
                    )}
                    <div>
                        <div className="streak-number">{streaks.currentStreak}</div>
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
                    <div className="stat-card-value">{streaks.longestStreak}</div>
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
                <div className="card" style={{ overflow: 'visible' }}>
                    <Heatmap justSolved={justSolved} />
                </div>
            </motion.div>
        </div>
    );
}
