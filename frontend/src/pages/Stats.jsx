import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import HeatmapCell, { INTENSITY_COLORS } from '../components/HeatmapCell.jsx';
import { getDailyActivity } from '../storage/activityStore.js';
import { calculateStreaks } from '../utils/streakCalculator.js';
import {
    BarChart3, Flame, Trophy, CheckCircle,
    Gem, Clock, Zap, Star, Calendar,
} from '../components/Icons.jsx';

/* ─── Build 7-row × N-column grid for a given year ─── */
function buildHeatmapGrid(activityMap, year) {
    const startDate = dayjs(`${year}-01-01`);
    const endDate = dayjs(`${year}-12-31`);
    const today = dayjs();
    const cells = [];

    let d = startDate;
    while (d.isBefore(endDate.add(1, 'day'))) {
        const dateStr = d.format('YYYY-MM-DD');
        const entry = activityMap[dateStr];
        cells.push({
            date: dateStr,
            dayOfWeek: d.day(),
            score: entry?.score || 0,
            intensity: entry?.intensity || 0,
            puzzleType: entry?.puzzleType || '',
            isToday: d.isSame(today, 'day'),
        });
        d = d.add(1, 'day');
    }

    const firstDow = cells[0].dayOfWeek;
    const weeks = [];
    let currentWeek = new Array(firstDow).fill(null);

    for (const cell of cells) {
        currentWeek.push(cell);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    return weeks;
}

/* ─── Month labels positioned at grid columns ─── */
function buildMonthLabels(weeks) {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, colIdx) => {
        const firstCell = week.find(c => c !== null);
        if (!firstCell) return;
        const month = dayjs(firstCell.date).month();
        if (month !== lastMonth) {
            if (labels.length === 0 || colIdx - labels[labels.length - 1].colIdx >= 3) {
                labels.push({ month: MONTHS[month], colIdx });
            }
            lastMonth = month;
        }
    });

    return labels;
}

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const LEGEND_LEVELS = [
    { color: INTENSITY_COLORS[0] },
    { color: INTENSITY_COLORS[1] },
    { color: INTENSITY_COLORS[2] },
    { color: INTENSITY_COLORS[3] },
    { color: INTENSITY_COLORS[4] },
    { color: INTENSITY_COLORS[5] },
];

function Heatmap({ justSolved }) {
    const userId = useSelector(state => state.auth.user?.id);
    const reduxHeatmap = useSelector(state => state.stats.heatmapData);
    const [activityMap, setActivityMap] = useState({});
    const [selectedYear, setSelectedYear] = useState(dayjs().year());

    const currentYear = dayjs().year();
    const availableYears = useMemo(() => {
        const years = [];
        for (let y = 2024; y <= currentYear; y++) years.push(y);
        return years;
    }, [currentYear]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const map = {};
            for (const [date, score] of Object.entries(reduxHeatmap || {})) {
                let intensity = 0;
                if (score > 0) intensity = 1;
                if (score >= 30) intensity = 2;
                if (score >= 60) intensity = 3;
                if (score >= 90) intensity = 4;
                if (score >= 100) intensity = 5;
                map[date] = { date, score, intensity, puzzleType: '', solved: score > 0 };
            }
            if (userId) {
                try {
                    const entries = await getDailyActivity(userId);
                    if (!cancelled && entries.length > 0) {
                        for (const e of entries) {
                            if (!map[e.date] || e.score >= (map[e.date]?.score || 0)) {
                                map[e.date] = e;
                            }
                        }
                    }
                } catch (err) { console.warn('Activity load failed:', err); }
            }
            if (!cancelled) setActivityMap(map);
        })();
        return () => { cancelled = true; };
    }, [userId, reduxHeatmap]);

    const weeks = useMemo(() => buildHeatmapGrid(activityMap, selectedYear), [activityMap, selectedYear]);
    const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);
    const totalWeeks = weeks.length;

    /*
     * Key design: ONE unified CSS grid for month labels + day labels + cells.
     *
     * Columns: [dayLabelCol] [week1] [week2] ... [weekN]
     * Using 1fr for week columns means they ALWAYS fit inside the container,
     * no matter how many weeks, no overflow.
     *
     * Month row:  gridRow 1
     * Day rows:   gridRow 2–8 (7 rows for Sun–Sat)
     */
    const gridCols = `24px repeat(${totalWeeks}, 1fr)`;

    return (
        <div className="heatmap-container">
            {/* Year selector */}
            <div className="heatmap-year-selector">
                {availableYears.map(year => (
                    <button
                        key={year}
                        className={`heatmap-year-btn ${year === selectedYear ? 'active' : ''}`}
                        onClick={() => setSelectedYear(year)}
                    >
                        {year}
                    </button>
                ))}
            </div>

            {/* Unified grid: month row + 7 data rows */}
            <div
                className="heatmap-unified-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridCols,
                    gridTemplateRows: `auto repeat(7, 1fr)`,
                    gap: '2px',
                }}
            >
                {/* ── Row 0: Month labels ── */}
                <span /> {/* spacer for day label column */}
                {(() => {
                    // Render month labels at their correct column positions
                    const elements = [];
                    let labelIdx = 0;
                    for (let w = 0; w < totalWeeks; w++) {
                        if (labelIdx < monthLabels.length && monthLabels[labelIdx].colIdx === w) {
                            elements.push(
                                <span key={`m-${w}`} className="heatmap-month-label">
                                    {monthLabels[labelIdx].month}
                                </span>
                            );
                            labelIdx++;
                        } else {
                            elements.push(<span key={`m-${w}`} />);
                        }
                    }
                    return elements;
                })()}

                {/* ── Rows 1–7: Day label + cells ── */}
                {[0, 1, 2, 3, 4, 5, 6].map(row => (
                    <React.Fragment key={`r-${row}`}>
                        <span className="heatmap-day-label">
                            {row % 2 === 1 ? DAY_LABELS[row] : ''}
                        </span>
                        {weeks.map((week, colIdx) => {
                            const cell = week[row];
                            return cell ? (
                                <HeatmapCell
                                    key={cell.date}
                                    date={cell.date}
                                    score={cell.score}
                                    intensity={cell.intensity}
                                    puzzleType={cell.puzzleType}
                                    isToday={cell.isToday}
                                    justSolved={justSolved}
                                    weekIndex={colIdx}
                                    totalWeeks={totalWeeks}
                                />
                            ) : (
                                <div key={`p-${colIdx}-${row}`} className="heatmap-cell-empty" />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="heatmap-legend-text">Less</span>
                {LEGEND_LEVELS.map((lv, i) => (
                    <div key={i} className="heatmap-legend-cell" style={{ backgroundColor: lv.color }} />
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
    const [justSolved, setJustSolved] = useState(false);
    const [enrichedStreaks, setEnrichedStreaks] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (userId) {
                try {
                    const entries = await getDailyActivity(userId);
                    if (!cancelled && entries.length > 0) {
                        setEnrichedStreaks(calculateStreaks(entries));
                    }
                } catch (e) { console.warn('Streak calc failed:', e); }
            }
        })();
        return () => { cancelled = true; };
    }, [userId, reduxHeatmap]);

    const currentStreak = Math.max(stats.currentStreak || 0, enrichedStreaks?.currentStreak || 0);
    const longestStreak = Math.max(stats.longestStreak || 0, enrichedStreaks?.longestStreak || 0, currentStreak);

    useEffect(() => {
        const today = dayjs().format('YYYY-MM-DD');
        if (reduxHeatmap[today] > 0) {
            setJustSolved(true);
            const t = setTimeout(() => setJustSolved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [reduxHeatmap]);

    const formatTime = (s) => {
        if (!s) return '—';
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title"><BarChart3 size={24} strokeWidth={1.5} /> Statistics</h1>
                <p className="page-subtitle">Your Logic Looper journey</p>
            </motion.div>

            {/* Streak */}
            <motion.div className="card" style={{ marginBottom: '24px', textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="streak-display" style={{ justifyContent: 'center' }}>
                    {currentStreak > 0 && <span className="streak-flame"><Flame size={32} strokeWidth={1.5} /></span>}
                    <div>
                        <div className="streak-number">{currentStreak}</div>
                        <div className="streak-label">Day Streak</div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div className="stats-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="stat-card">
                    <div className="stat-card-icon"><Trophy size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{longestStreak}</div>
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
            <motion.div className="section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="section-title"><Calendar size={18} strokeWidth={1.5} /> Activity</div>
                <div className="card" style={{ overflow: 'visible', padding: '14px' }}>
                    <Heatmap justSolved={justSolved} />
                </div>
            </motion.div>
        </div>
    );
}
