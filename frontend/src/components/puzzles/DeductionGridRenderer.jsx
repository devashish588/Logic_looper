import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, AlertTriangle } from '../Icons.jsx';

export default function DeductionGridRenderer({ puzzle, onAnswer }) {
    const { categories, clues } = puzzle;
    const [assignments, setAssignments] = useState({});

    function handleChange(name, field, value) {
        const newAssignments = {
            ...assignments,
            [name]: {
                ...assignments[name],
                [field]: value,
            },
        };
        setAssignments(newAssignments);
        onAnswer(newAssignments);
    }

    return (
        <div className="puzzle-area" style={{ width: '100%', maxWidth: '600px' }}>
            {/* Clues */}
            <div className="section">
                <div className="section-title"><Lightbulb size={18} strokeWidth={1.5} /> Clues</div>
                <div className="deduction-container">
                    {clues.map((clue, i) => (
                        <motion.div
                            key={i}
                            className="deduction-clue"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <span className="deduction-clue-icon">
                                {clue.type === 'negative' ? <AlertTriangle size={16} strokeWidth={1.5} /> : <CheckCircle size={16} strokeWidth={1.5} />}
                            </span>
                            {clue.text}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Assignment Table */}
            <div className="section">
                <div className="section-title">Your Assignments</div>
                <div className="deduction-assignments">
                    {categories.names.map((name, i) => (
                        <motion.div
                            key={name}
                            className="deduction-row"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                        >
                            <span className="deduction-name">{name}</span>
                            <select
                                className="deduction-select"
                                value={assignments[name]?.color || ''}
                                onChange={(e) => handleChange(name, 'color', e.target.value)}
                            >
                                <option value="">— Color —</option>
                                {categories.colors.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <select
                                className="deduction-select"
                                value={assignments[name]?.item || ''}
                                onChange={(e) => handleChange(name, 'item', e.target.value)}
                            >
                                <option value="">— Item —</option>
                                {categories.items.map(it => (
                                    <option key={it} value={it}>{it}</option>
                                ))}
                            </select>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
