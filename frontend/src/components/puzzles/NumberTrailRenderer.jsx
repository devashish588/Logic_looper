import React, { useEffect, useRef, useState } from 'react';
import { canExtend } from '../../engine/types/numberTrail.js';
import { Undo2, RotateCcw } from '../Icons.jsx';

const GAP = 4;
// Smaller cells on narrow phones so a 5x5 board always fits. The path line and the
// grid both use this value, so they can't drift apart.
const cellSize = () => (typeof window !== 'undefined' && window.innerWidth < 400 ? 52 : 64);

export default function NumberTrailRenderer({ puzzle, onAnswer, highlight }) {
    const { size, givens } = puzzle;
    const [CELL] = useState(cellSize);
    const pitch = CELL + GAP;
    const total = size * size;
    const givenAt = new Map(Object.entries(givens).map(([n, cell]) => [cell, Number(n)]));
    const startCell = givens[1];

    const [trail, setTrail] = useState([startCell]);
    const [rejected, setRejected] = useState(null);
    const dragging = useRef(false);
    const hinted = new Set(highlight?.cells || []);

    useEffect(() => {
        const stop = () => { dragging.current = false; };
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
    }, []);

    function commit(next) {
        setTrail(next);
        onAnswer({ trail: next });
    }

    function flash(cell) {
        setRejected(cell);
        setTimeout(() => setRejected(null), 350);
    }

    /**
     * Press: tapping a cell already on the trail rewinds to it; tapping the
     * next cell extends. Drag: extend, or step back onto the previous cell.
     */
    function press(cell, isDrag) {
        const idx = trail.indexOf(cell);
        if (idx !== -1) {
            if (isDrag) {
                if (idx === trail.length - 2) commit(trail.slice(0, -1));
            } else if (idx < trail.length - 1) {
                commit(trail.slice(0, idx + 1));
            }
            return;
        }
        if (canExtend(puzzle, trail, cell)) {
            commit([...trail, cell]);
        } else if (!isDrag) {
            flash(cell);
        } else {
            const last = trail[trail.length - 1];
            // Only flash for a neighbouring cell the rules forbid, not for stray movement
            if (Math.abs(Math.floor(last / size) - Math.floor(cell / size)) + Math.abs((last % size) - (cell % size)) === 1) flash(cell);
        }
    }

    function move(e) {
        if (!dragging.current) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const node = el?.closest?.('[data-cell]');
        if (node) press(Number(node.dataset.cell), true);
    }

    const center = (cell) => ({
        x: (cell % size) * pitch + CELL / 2,
        y: Math.floor(cell / size) * pitch + CELL / 2,
    });
    const points = trail.map(c => { const p = center(c); return `${p.x},${p.y}`; }).join(' ');
    const stepOf = new Map(trail.map((c, i) => [c, i + 1]));
    const boardPx = size * pitch - GAP;
    const head = trail[trail.length - 1];

    return (
        <div className="puzzle-area">
            <div className="game-status">
                <span>Step <strong>{trail.length}</strong> / {total}</span>
                <span className="text-muted">Next number: {trail.length < total ? trail.length + 1 : '—'}</span>
            </div>

            <div className="trail-board" style={{ width: boardPx, height: boardPx }}>
                <svg className="trail-line" width={boardPx} height={boardPx} aria-hidden="true">
                    <polyline points={points} />
                </svg>
                <div
                    className="trail-grid"
                    style={{ gridTemplateColumns: `repeat(${size}, ${CELL}px)`, gap: GAP }}
                    onPointerMove={move}
                >
                    {Array.from({ length: total }, (_, cell) => {
                        const step = stepOf.get(cell);
                        const given = givenAt.get(cell);
                        const onTrail = step !== undefined;
                        return (
                            <button
                                key={cell}
                                type="button"
                                data-cell={cell}
                                style={{ width: CELL, height: CELL }}
                                className={`trail-cell ${onTrail ? 'visited' : ''} ${cell === head ? 'head' : ''} ${given ? 'given' : ''} ${rejected === cell ? 'rejected' : ''} ${hinted.has(cell) ? 'hinted' : ''}`}
                                aria-label={`Row ${Math.floor(cell / size) + 1}, column ${(cell % size) + 1}${given ? `, number ${given}` : ''}${onTrail ? `, step ${step}` : ''}`}
                                onPointerDown={(e) => { e.preventDefault(); dragging.current = true; press(cell, false); }}
                            >
                                {given ? given : (onTrail ? <span className="trail-step">{step}</span> : '')}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="game-tools">
                <button type="button" className="btn btn-secondary btn-sm" disabled={trail.length <= 1}
                    onClick={() => commit(trail.slice(0, -1))}>
                    <Undo2 size={14} strokeWidth={1.5} /> Undo
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={trail.length <= 1}
                    onClick={() => commit([startCell])}>
                    <RotateCcw size={14} strokeWidth={1.5} /> Restart
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 420 }}>
                Start at 1 and draw a path through every cell exactly once, moving up, down, left or right. The numbers
                shown must be reached at exactly that step. Drag to draw, or tap cells one at a time. Tap an earlier cell to rewind.
            </p>
        </div>
    );
}
