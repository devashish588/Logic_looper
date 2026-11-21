import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { getPuzzleTypeForDate, getTodayDateString } from '../engine/generator.js';
import { PUZZLE_LABELS } from '../utils/constants.js';
import { loadPracticeResults } from '../storage/db.js';
import { ARCHIVE_DAYS } from './Play.jsx';
import { PuzzleIcon, CalendarDays, ChevronLeft, ChevronRight } from '../components/Icons.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Archive() {
    const userId = useSelector(state => state.auth.user?.id);
    const history = useSelector(state => state.stats.history);
    const frozenDates = useSelector(state => state.stats.frozenDates);
    const [practice, setPractice] = useState({});
    const [month, setMonth] = useState(() => dayjs().startOf('month'));

    const today = getTodayDateString();
    const earliest = dayjs(today).subtract(ARCHIVE_DAYS, 'day');
    const frozen = useMemo(() => new Set(frozenDates), [frozenDates]);

    useEffect(() => {
        let cancelled = false;
        loadPracticeResults(userId)
            .then(r => { if (!cancelled) setPractice(r); })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [userId]);

    const cells = useMemo(() => {
        const out = Array(month.day()).fill(null); // pad to the first weekday
        for (let i = 0; i < month.daysInMonth(); i++) {
            const d = month.add(i, 'day');
            const date = d.format('YYYY-MM-DD');
            let status = 'open';
            if (date > today) status = 'future';
            else if (d.isBefore(earliest, 'day')) status = 'locked';
            else if (history[date]) status = 'solved';
            else if (practice[date]) status = 'practiced';
            else if (frozen.has(date)) status = 'frozen';
            else if (date < today) status = 'missed';
            out.push({
                date,
                day: d.date(),
                type: getPuzzleTypeForDate(date),
                status,
                isToday: date === today,
                points: history[date]?.points ?? practice[date]?.points,
            });
        }
        return out;
    }, [month, history, practice, frozen, today, earliest]);

    const monthDays = cells.filter(c => c && c.status !== 'future' && c.status !== 'locked');
    const doneCount = monthDays.filter(c => c.status === 'solved' || c.status === 'practiced').length;
    const canGoBack = month.isAfter(earliest, 'month');
    const canGoForward = month.isBefore(dayjs(today), 'month');

    return (
        <div>
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title">
                    <CalendarDays size={24} strokeWidth={1.5} /> Puzzle Archive
                </h1>
                <p className="page-subtitle">
                    Replay any puzzle from the past year. Practice doesn't affect your streak or ranks.
                    {' '}<Link to="/free" className="inline-link">Want something different? Try Free Play.</Link>
                </p>
            </motion.div>

            <div className="card archive-card">
                <div className="archive-nav">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setMonth(m => m.subtract(1, 'month'))}
                        disabled={!canGoBack}
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <div className="archive-month">
                        <div className="archive-month-name">{month.format('MMMM YYYY')}</div>
                        <div className="text-muted archive-month-count">
                            {doneCount} of {monthDays.length} played
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setMonth(m => m.add(1, 'month'))}
                        disabled={!canGoForward}
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="archive-grid">
                    {WEEKDAYS.map(w => <div key={w} className="archive-weekday">{w}</div>)}
                    {cells.map((c, i) => {
                        if (!c) return <div key={`pad-${i}`} />;
                        const title = `${c.date} · ${PUZZLE_LABELS[c.type]}${c.points ? ` · ${c.points} pts` : ''}`;
                        const body = (
                            <>
                                <span className="archive-day-num">{c.day}</span>
                                <PuzzleIcon type={c.type} size={16} />
                            </>
                        );
                        const className = `archive-day ${c.status} ${c.isToday ? 'today' : ''}`;
                        if (c.status === 'future' || c.status === 'locked') {
                            return <div key={c.date} className={className} title={title}>{body}</div>;
                        }
                        return (
                            <Link
                                key={c.date}
                                to={c.isToday ? '/play' : `/practice/${c.date}`}
                                className={className}
                                title={title}
                            >
                                {body}
                            </Link>
                        );
                    })}
                </div>

                <div className="archive-legend">
                    <span><i className="archive-swatch solved" /> Solved on the day</span>
                    <span><i className="archive-swatch practiced" /> Practiced</span>
                    <span><i className="archive-swatch frozen" /> Streak freeze</span>
                    <span><i className="archive-swatch missed" /> Not played</span>
                </div>
            </div>
        </div>
    );
}
