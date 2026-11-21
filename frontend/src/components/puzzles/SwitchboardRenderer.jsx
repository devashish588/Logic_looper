import React, { useMemo, useState } from 'react';
import { applyPresses } from '../../engine/types/switchboard.js';
import { Undo2, RotateCcw } from '../Icons.jsx';

export default function SwitchboardRenderer({ puzzle, onAnswer, highlight }) {
    const { size, lights: initial, par } = puzzle;
    const [presses, setPresses] = useState([]);

    const lights = useMemo(() => applyPresses(initial, presses, size), [initial, presses, size]);
    const lit = lights.filter(Boolean).length;
    const hinted = new Set(highlight?.cells || []);

    function commit(next) {
        setPresses(next);
        onAnswer({ presses: next });
    }

    return (
        <div className="puzzle-area">
            <div className="game-status">
                <span><strong>{lit}</strong> / {size * size} lit</span>
                <span>Presses: <strong>{presses.length}</strong></span>
                <span className="text-muted">Fewest possible: {par}</span>
            </div>

            <div className="switch-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
                {lights.map((on, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`switch-cell ${on ? 'on' : 'off'} ${hinted.has(i) ? 'hinted' : ''}`}
                        onClick={() => commit([...presses, i])}
                        aria-label={`Row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}: ${on ? 'lit' : 'dark'}`}
                        aria-pressed={on}
                    />
                ))}
            </div>

            <div className="game-tools">
                <button type="button" className="btn btn-secondary btn-sm" disabled={!presses.length}
                    onClick={() => commit(presses.slice(0, -1))}>
                    <Undo2 size={14} strokeWidth={1.5} /> Undo
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={!presses.length}
                    onClick={() => commit([])}>
                    <RotateCcw size={14} strokeWidth={1.5} /> Reset
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                Pressing a switch flips it and the switches directly above, below, left and right of it.
                Pressing twice undoes itself, so you never need to press a switch more than once.
            </p>
        </div>
    );
}
