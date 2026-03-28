import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const BLUESTOCK_ORANGE = '#F05537';

export default function BinaryLogicRenderer({ puzzle, onAnswer }) {
    const { inputs, gates, questions } = puzzle;
    const [answers, setAnswers] = useState({});
    const hintedCells = useSelector(state => state.game.hintedCells);

    // Track hinted gates
    const hintedGateMap = useMemo(() => {
        const map = {};
        hintedCells.forEach(h => {
            if (h.type === 'gate') {
                map[h.gateId] = String(h.value);
            }
        });
        return map;
    }, [hintedCells]);

    // Apply hint values
    useEffect(() => {
        let changed = false;
        const newAnswers = { ...answers };
        for (const hint of hintedCells) {
            if (hint.type === 'gate' && newAnswers[hint.gateId] !== String(hint.value)) {
                newAnswers[hint.gateId] = String(hint.value);
                changed = true;
            }
        }
        if (changed) {
            setAnswers(newAnswers);
            onAnswer(newAnswers);
        }
    }, [hintedCells]);

    const isQuestion = (gateId) => questions.some(q => q.gateId === gateId);

    function handleToggle(gateId) {
        if (hintedGateMap[gateId]) return; // Can't override hints
        const current = answers[gateId];
        const next = current === undefined || current === '' ? '1' : current === '1' ? '0' : '1';
        const newAnswers = { ...answers, [gateId]: next };
        setAnswers(newAnswers);
        onAnswer(newAnswers);
    }

    function handleChange(gateId, value) {
        const newAnswers = { ...answers, [gateId]: value };
        setAnswers(newAnswers);
        onAnswer(newAnswers);
    }

    return (
        <div className="puzzle-area">
            <p className="text-muted mb-16" style={{ fontSize: '0.82rem' }}>
                Determine the output of each highlighted gate (0 or 1). Tap a gate to toggle its value.
            </p>

            {/* Inputs */}
            <div className="circuit-inputs">
                {inputs.map((inp) => (
                    <motion.div
                        key={inp.id}
                        className="circuit-input"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="circuit-label">{inp.label}</span>
                        <span className={`circuit-value v-${inp.value}`}>{inp.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Gate Layers */}
            <div className="circuit-container">
                {gates.map((layer, li) => (
                    <motion.div
                        key={li}
                        className="gate-layer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + li * 0.15 }}
                    >
                        {layer.map((gate) => {
                            const unknown = isQuestion(gate.id);
                            const currentVal = answers[gate.id];
                            const isHinted = !!hintedGateMap[gate.id];
                            return (
                                <motion.div
                                    key={gate.id}
                                    className={`gate-box ${unknown ? 'unknown' : ''}`}
                                    onClick={() => unknown && !isHinted && handleToggle(gate.id)}
                                    whileTap={unknown && !isHinted ? { scale: 0.95 } : {}}
                                    style={{
                                        ...(unknown ? { cursor: isHinted ? 'default' : 'pointer' } : {}),
                                        ...(isHinted ? {
                                            borderColor: BLUESTOCK_ORANGE,
                                            borderWidth: '2px',
                                            boxShadow: `0 0 14px ${BLUESTOCK_ORANGE}40`,
                                        } : {}),
                                    }}
                                    animate={isHinted ? {
                                        scale: [1, 1.08, 1],
                                        borderColor: [BLUESTOCK_ORANGE, BLUESTOCK_ORANGE, BLUESTOCK_ORANGE],
                                    } : {}}
                                    transition={isHinted ? { duration: 0.5, ease: 'easeOut' } : {}}
                                >
                                    <span className="gate-type">{gate.type}</span>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        {gate.inputs.map(id => {
                                            const inp = inputs.find(i => i.id === id);
                                            return inp ? inp.label : id.replace('gate_', 'G');
                                        }).join(gate.type === 'NOT' ? '' : ' , ')}
                                    </div>
                                    {unknown ? (
                                        <div className="gate-output">
                                            {/* Tap to toggle on mobile, input on desktop */}
                                            <motion.span
                                                key={currentVal}
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    display: 'inline-block',
                                                    minWidth: '30px',
                                                    textAlign: 'center',
                                                    color: isHinted ? BLUESTOCK_ORANGE :
                                                        currentVal === '1' ? 'var(--accent-success)' :
                                                        currentVal === '0' ? 'var(--accent-danger)' :
                                                            'var(--text-muted)',
                                                    fontWeight: isHinted ? 900 : 800,
                                                    fontSize: '1.1rem',
                                                }}
                                            >
                                                {currentVal ?? '?'}
                                            </motion.span>
                                        </div>
                                    ) : (
                                        <span className="gate-output" style={{
                                            color: gate.output === 1 ? 'var(--accent-success)' : 'var(--accent-danger)'
                                        }}>
                                            {gate.output}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
