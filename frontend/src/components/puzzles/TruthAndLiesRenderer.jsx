import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TruthAndLiesRenderer({ puzzle, onAnswer }) {
    const { characters, statements } = puzzle;
    const [answers, setAnswers] = useState({});

    function toggleRole(name) {
        const current = answers[name];
        let next;
        if (!current) next = 'knight';
        else if (current === 'knight') next = 'knave';
        else next = 'knight';

        const updated = { ...answers, [name]: next };
        setAnswers(updated);
        onAnswer(updated);
    }

    return (
        <div className="puzzle-area">
            <div className="truth-lies-grid">
                {characters.map((name, i) => {
                    const statement = statements.find((s) => s.speaker === name);
                    const role = answers[name];

                    return (
                        <motion.div
                            key={name}
                            className={`truth-lies-card ${role ? `role-${role}` : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="truth-lies-name">{name}</div>
                            <div className="truth-lies-statement">
                                "{statement?.text}"
                            </div>
                            <button
                                className={`truth-lies-toggle ${role || 'unset'}`}
                                onClick={() => toggleRole(name)}
                            >
                                {role
                                    ? role === 'knight'
                                        ? '🛡️ Knight'
                                        : '🎭 Knave'
                                    : 'Tap to identify'}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem' }}>
                Knights always tell the truth. Knaves always lie. Identify each character.
            </p>
        </div>
    );
}
