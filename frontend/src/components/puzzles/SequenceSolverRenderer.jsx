import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const BLUESTOCK_ORANGE = '#F05537';

export default function SequenceSolverRenderer({ puzzle, onAnswer }) {
    const [answers, setAnswers] = useState({});
    const hintedCells = useSelector(state => state.game.hintedCells);

    // Track hinted sequence blanks
    const hintedMap = useMemo(() => {
        const map = {};
        hintedCells.forEach(h => {
            if (h.type === 'sequence') {
                map[h.key] = String(h.value);
            }
        });
        return map;
    }, [hintedCells]);

    // Apply hint values to answers when new hints arrive
    useEffect(() => {
        let changed = false;
        const newAnswers = { ...answers };
        for (const hint of hintedCells) {
            if (hint.type === 'sequence' && newAnswers[hint.key] !== String(hint.value)) {
                newAnswers[hint.key] = String(hint.value);
                changed = true;
            }
        }
        if (changed) {
            setAnswers(newAnswers);
            onAnswer(newAnswers);
        }
    }, [hintedCells]);

    function handleChange(roundIdx, blankIdx, value) {
        const key = `${roundIdx}-${blankIdx}`;
        if (hintedMap[key]) return; // Can't overwrite hinted values
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);
        onAnswer(newAnswers);
    }

    return (
        <div className="puzzle-area">
            <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
                Find the pattern and fill in the missing numbers
            </p>

            {puzzle.rounds.map((round, ri) => (
                <motion.div
                    key={ri}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ri * 0.15 }}
                    style={{ marginBottom: '24px' }}
                >
                    <p className="text-muted mb-8" style={{ fontSize: '0.8rem' }}>
                        Sequence {ri + 1} of {puzzle.totalRounds}
                    </p>
                    <div className="sequence-row">
                        {round.sequence.map((num, si) => {
                            const blankIndex = round.blanks.indexOf(si);
                            const isBlank = blankIndex !== -1;
                            const key = `${ri}-${blankIndex}`;
                            const isHinted = isBlank && !!hintedMap[key];

                            return (
                                <React.Fragment key={si}>
                                    {si > 0 && <span className="sequence-arrow">→</span>}
                                    {isBlank ? (
                                        <motion.div
                                            className={`sequence-num sequence-blank ${isHinted ? 'sequence-hinted' : ''}`}
                                            whileFocus={!isHinted ? { scale: 1.05, borderColor: 'var(--accent-primary)' } : {}}
                                            style={isHinted ? {
                                                borderColor: BLUESTOCK_ORANGE,
                                                borderStyle: 'solid',
                                                boxShadow: `0 0 12px ${BLUESTOCK_ORANGE}40`,
                                            } : {}}
                                            animate={isHinted ? {
                                                scale: [1, 1.1, 1],
                                            } : {}}
                                            transition={isHinted ? { duration: 0.5, ease: 'easeOut' } : {}}
                                        >
                                            {isHinted ? (
                                                <span style={{
                                                    color: BLUESTOCK_ORANGE,
                                                    fontWeight: 800,
                                                    fontSize: '1.05rem',
                                                }}>
                                                    {hintedMap[key]}
                                                </span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={answers[key] || ''}
                                                    onChange={(e) => handleChange(ri, blankIndex, e.target.value)}
                                                    placeholder="?"
                                                />
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="sequence-num">{num}</div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
