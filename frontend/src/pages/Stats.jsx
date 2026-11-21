import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import HeatmapCell, { INTENSITY_COLORS } from '../components/HeatmapCell.jsx';
import { PUZZLE_LABELS, PUZZLE_TYPES, RETIRED_PUZZLE_TYPES } from '../utils/constants.js';
import { MAX_FREEZES, FREEZE_EVERY } from '../utils/streakCalculator.js';
import {
    BarChart3, Flame, Trophy, CheckCircle,
    Gem, Clock, Zap, Star, Calendar, Snowflake,
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
            frozen: Boolean(entry?.frozen),
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
            if (labels.length === 0 || colIdx - labels[labels.length - 1].colIdx >= 4) {
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
const FREEZE_LEGEND_COLOR = 'var(--freeze-color)';

function Heatmap({ justSolved }) {
    // Built from the same merged history as every other number on this page, so older days can never
    // be hidden by a second data source.
    const history = useSelector(state => state.stats.history);
    const frozenDates = useSelector(state => state.stats.frozenDates);
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState(dayjs().year());

    const currentYear = dayjs().year();
    const availableYears = useMemo(() => {
        const years = [];
        for (let y = 2024; y <= currentYear; y++) years.push(y);
        return years;
    }, [currentYear]);

    const activityMap = useMemo(() => {
        const map = {};
        for (const e of Object.values(history)) {
            map[e.date] = { date: e.date, score: e.points, puzzleType: e.puzzleType, solved: true };
        }
        for (const date of frozenDates) {
            if (!map[date]) map[date] = { date, score: 0, frozen: true };
        }
        return map;
    }, [history, frozenDates]);

    // Clicking a past day opens that day's puzzle for practice
    const openDay = useCallback((date) => {
        navigate(date === dayjs().format('YYYY-MM-DD') ? '/play' : `/practice/${date}`);
    }, [navigate]);

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
    // minmax(0, 1fr): columns may shrink below their content, so the grid always fits a narrow phone
    const gridCols = `24px repeat(${totalWeeks}, minmax(0, 1fr))`;

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
                                    frozen={cell.frozen}
                                    onSelect={openDay}
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
                <div className="heatmap-legend-cell" style={{ backgroundColor: FREEZE_LEGEND_COLOR, marginLeft: '12px' }} />
                <span className="heatmap-legend-text">Freeze</span>
            </div>
        </div>
    );
}

export default function Stats() {
    const stats = useSelector(state => state.stats);
    const [justSolved, setJustSolved] = useState(false);
    const currentStreak = stats.currentStreak;
    const longestStreak = stats.longestStreak;

    useEffect(() => {
        const today = dayjs().format('YYYY-MM-DD');
        if (stats.heatmapData[today] > 0) {
            setJustSolved(true);
            const t = setTimeout(() => setJustSolved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [stats.heatmapData]);

    // Solves per puzzle type, for the breakdown bars (retired types only show if there is history)
    const typeCounts = useMemo(() => {
        const counts = {};
        for (const e of Object.values(stats.history)) counts[e.puzzleType] = (counts[e.puzzleType] || 0) + 1;
        return counts;
    }, [stats.history]);
    const breakdownTypes = [...PUZZLE_TYPES, ...RETIRED_PUZZLE_TYPES.filter(t => typeCounts[t] > 0)];
    const maxTypeCount = Math.max(1, ...breakdownTypes.map(t => typeCounts[t] || 0));

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

            {stats.recoveredCount > 0 && (
                <div className="recovery-banner" role="status">
                    Restored {stats.recoveredCount} day{stats.recoveredCount === 1 ? '' : 's'} of progress
                    from this device and backed {stats.recoveredCount === 1 ? 'it' : 'them'} up to your account.
                </div>
            )}

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
                <p className="text-muted streak-help">
                    Every {FREEZE_EVERY} days in a row earns a streak freeze (hold up to {MAX_FREEZES}).
                    Miss a day and a freeze is used automatically, so your streak survives.
                    Click any past day on the heatmap to practice it.
                </p>
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
                    <div className="stat-card-icon"><Snowflake size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.freezesAvailable}/{MAX_FREEZES}</div>
                    <div className="stat-card-label">
                        {stats.nextFreezeIn ? `Freezes · next in ${stats.nextFreezeIn}` : 'Freezes · bank full'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon"><Star size={24} strokeWidth={1.5} /></div>
                    <div className="stat-card-value">{stats.solvedTypes.length}/{PUZZLE_TYPES.length}</div>
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

            {/* Per-type breakdown */}
            <motion.div className="section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="section-title"><Star size={18} strokeWidth={1.5} /> Puzzle Types</div>
                <div className="card type-breakdown">
                    {breakdownTypes.map(type => (
                        <div key={type} className="type-row">
                            <span className="type-row-label">
                                {PUZZLE_LABELS[type]}{RETIRED_PUZZLE_TYPES.includes(type) ? ' (retired)' : ''}
                            </span>
                            <div className="type-row-track">
                                <div className="type-row-fill" style={{ width: `${((typeCounts[type] || 0) / maxTypeCount) * 100}%` }} />
                            </div>
                            <span className="type-row-count">{typeCounts[type] || 0}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
