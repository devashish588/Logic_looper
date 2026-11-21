import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { getTodayDateString } from '../engine/generator.js';
import { API_URL } from '../utils/syncManager.js';
import { Medal, Flame, Clock } from '../components/Icons.jsx';

const TABS = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'alltime', label: 'All time' },
];

function formatTime(s) {
    if (!s) return '—';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Leaderboard() {
    const userId = useSelector(state => state.auth.user?.id);
    const syncStatus = useSelector(state => state.stats.syncStatus);
    const [tab, setTab] = useState('today');
    const [state, setState] = useState({ loading: true, error: null, entries: [] });

    useEffect(() => {
        let cancelled = false;
        setState(s => ({ ...s, loading: true, error: null }));

        const url = tab === 'today'
            ? `${API_URL}/leaderboard/daily?date=${getTodayDateString()}&limit=50`
            : `${API_URL}/leaderboard?period=${tab}&limit=50`;

        fetch(url)
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
            .then(data => { if (!cancelled) setState({ loading: false, error: null, entries: data.entries || [] }); })
            .catch(() => { if (!cancelled) setState({ loading: false, error: 'Leaderboard unavailable offline.', entries: [] }); });

        return () => { cancelled = true; };
        // Refetch after a sync so your own new score shows up.
    }, [tab, syncStatus]);

    return (
        <div>
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title">
                    <Medal size={24} strokeWidth={1.5} /> Leaderboard
                </h1>
                <p className="page-subtitle">Everyone plays the same puzzle each day</p>
            </motion.div>

            <div className="lb-tabs" role="tablist">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={tab === t.id}
                        className={`lb-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="card lb-card">
                {state.loading && <p className="text-muted">Loading…</p>}
                {!state.loading && state.error && <p className="text-muted">{state.error}</p>}
                {!state.loading && !state.error && state.entries.length === 0 && (
                    <p className="text-muted">
                        {tab === 'today' ? 'Nobody has solved today\'s puzzle yet. Be the first!' : 'No scores yet.'}
                    </p>
                )}
                {!state.loading && !state.error && state.entries.length > 0 && (
                    <ol className="lb-list">
                        {state.entries.map(e => (
                            <li key={e.userId} className={`lb-row ${e.userId === userId ? 'me' : ''}`}>
                                <span className={`lb-rank r${e.rank}`}>{e.rank}</span>
                                <span className="lb-name">
                                    {e.displayName}
                                    {e.userId === userId && <span className="lb-you">you</span>}
                                </span>
                                {tab === 'today' ? (
                                    <span className="lb-meta"><Clock size={14} strokeWidth={1.5} /> {formatTime(e.timeSeconds)}</span>
                                ) : (
                                    <span className="lb-meta" title="Current streak">
                                        <Flame size={14} strokeWidth={1.5} /> {e.streak}
                                    </span>
                                )}
                                <span className="lb-points">{e.points}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}
