import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPuzzleTypeForDate, getTodayDateString, FREE_PLAY_LEVELS } from '../engine/generator.js';
import { PUZZLE_TYPES, PUZZLE_LABELS, PUZZLE_DESCRIPTIONS } from '../utils/constants.js';
import { PuzzleIcon, Dices } from '../components/Icons.jsx';

// Same three names as the daily difficulty picker (the ids are the engine's internal levels)
const LEVELS = [
    { id: 'easy', label: 'Novice' },
    { id: 'medium', label: 'Intermediate' },
    { id: 'hard', label: 'Expert' },
];

const newSeed = () => Math.floor(Math.random() * 1e6);

export default function FreePlay() {
    const navigate = useNavigate();
    const todaysType = getPuzzleTypeForDate(getTodayDateString());

    function play(type, level) {
        navigate(`/free/${type}/${level}/${newSeed()}`);
    }

    function surprise() {
        const types = PUZZLE_TYPES;
        const levels = Object.keys(FREE_PLAY_LEVELS);
        play(types[Math.floor(Math.random() * types.length)], levels[Math.floor(Math.random() * levels.length)]);
    }

    return (
        <div>
            <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="page-title">
                    <Dices size={24} strokeWidth={1.5} /> Free Play
                </h1>
                <p className="page-subtitle">
                    {PUZZLE_TYPES.length} games, unlimited puzzles. Doesn't affect your streak or the leaderboard.
                </p>
            </motion.div>

            <div className="free-top">
                <button className="btn btn-primary" onClick={surprise}>
                    <Dices size={16} strokeWidth={1.5} /> Surprise me
                </button>
            </div>

            <div className="free-grid">
                {PUZZLE_TYPES.map((type, i) => (
                    <motion.div
                        key={type}
                        className="card free-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <div className="free-card-head">
                            <span className="free-card-icon"><PuzzleIcon type={type} size={22} /></span>
                            <div>
                                <div className="free-card-name">
                                    {PUZZLE_LABELS[type]}
                                    {type === todaysType && <span className="badge badge-type free-today">Today's</span>}
                                </div>
                            </div>
                        </div>
                        <p className="free-card-desc">{PUZZLE_DESCRIPTIONS[type]}</p>
                        <div className="free-levels">
                            {LEVELS.map(l => (
                                <button key={l.id} className="btn btn-secondary btn-sm" onClick={() => play(type, l.id)}>
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
