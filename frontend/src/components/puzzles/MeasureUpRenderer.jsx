import React, { useMemo, useState } from 'react';
import { applyMove, replay, JUG_NAMES } from '../../engine/types/measureUp.js';
import { Undo2, RotateCcw } from '../Icons.jsx';

const UNIT = 16; // px of jug height per litre

export default function MeasureUpRenderer({ puzzle, onAnswer, highlight }) {
    const { capacities, mode, target, par } = puzzle;
    const [moves, setMoves] = useState([]);
    const state = useMemo(() => replay(puzzle, moves), [puzzle, moves]);
    const hintedJugs = new Set(highlight?.jugs || []);

    function commit(next) {
        setMoves(next);
        onAnswer({ moves: next });
    }

    function doMove(move) {
        if (applyMove(state, puzzle, move)) commit([...moves, move]);
    }

    return (
        <div className="puzzle-area">
            <div className="measure-goal">
                Goal: get exactly <strong>{target} L</strong> in any jug
            </div>
            <div className="game-status">
                <span>Moves: <strong>{moves.length}</strong></span>
                <span className="text-muted">Fewest possible: {par}</span>
            </div>

            <div className="jug-row">
                {capacities.map((cap, i) => {
                    const amount = state[i];
                    return (
                        <div key={i} className={`jug ${hintedJugs.has(i) ? 'hinted' : ''} ${amount === target ? 'goal' : ''}`}>
                            <div className="jug-name">Jug {JUG_NAMES[i]}</div>
                            <div className="jug-glass" style={{ height: cap * UNIT }}
                                role="img" aria-label={`Jug ${JUG_NAMES[i]}: ${amount} of ${cap} litres`}>
                                <div className="jug-water" style={{ height: amount * UNIT }} />
                                <span className="jug-amount">{amount}</span>
                            </div>
                            <div className="jug-cap">holds {cap} L</div>

                            <div className="jug-actions">
                                {mode === 'tap' && (
                                    <>
                                        <button type="button" className="btn btn-secondary btn-sm"
                                            disabled={!applyMove(state, puzzle, { a: 'fill', i })}
                                            onClick={() => doMove({ a: 'fill', i })}>Fill</button>
                                        <button type="button" className="btn btn-secondary btn-sm"
                                            disabled={!applyMove(state, puzzle, { a: 'empty', i })}
                                            onClick={() => doMove({ a: 'empty', i })}>Empty</button>
                                    </>
                                )}
                                {capacities.map((_, to) => to !== i && (
                                    <button key={to} type="button" className="btn btn-secondary btn-sm"
                                        disabled={!applyMove(state, puzzle, { a: 'pour', from: i, to })}
                                        onClick={() => doMove({ a: 'pour', from: i, to })}>
                                        Pour → {JUG_NAMES[to]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="game-tools">
                <button type="button" className="btn btn-secondary btn-sm" disabled={!moves.length}
                    onClick={() => commit(moves.slice(0, -1))}>
                    <Undo2 size={14} strokeWidth={1.5} /> Undo
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={!moves.length}
                    onClick={() => commit([])}>
                    <RotateCcw size={14} strokeWidth={1.5} /> Start over
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 420 }}>
                {mode === 'tap'
                    ? 'The jugs have no markings: you can only fill one to the top, empty one completely, or pour one into another until the source is empty or the target is full.'
                    : 'There is no tap: the largest jug starts full. Pour between jugs until the source is empty or the target is full.'}
            </p>
        </div>
    );
}
