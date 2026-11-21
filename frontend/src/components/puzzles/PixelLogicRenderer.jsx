import React, { useCallback, useEffect, useRef, useState } from 'react';
import { lineDone } from '../../engine/types/pixelLogic.js';
import { RotateCcw } from '../Icons.jsx';

// Cell states: 0 = unknown, 1 = filled, 2 = marked empty (a note to yourself)
export default function PixelLogicRenderer({ puzzle, onAnswer, highlight }) {
    const { size, rowClues, colClues } = puzzle;
    const [grid, setGrid] = useState(() => Array.from({ length: size }, () => Array(size).fill(0)));
    const gridRef = useRef(grid); // latest grid, so fast drags never read a stale one
    const [tool, setTool] = useState('fill'); // 'fill' | 'mark'
    const drag = useRef(null); // { value } while the pointer is down
    const hinted = new Set(highlight?.cells || []);

    const replaceGrid = useCallback((next) => {
        gridRef.current = next;
        setGrid(next);
        onAnswer({ grid: next });
    }, [onAnswer]);

    const paint = useCallback((r, c, value) => {
        const cur = gridRef.current;
        if (cur[r][c] === value) return;
        const next = cur.map(row => [...row]);
        next[r][c] = value;
        replaceGrid(next);
    }, [replaceGrid]);

    useEffect(() => {
        const stop = () => { drag.current = null; };
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
        };
    }, []);

    function start(e, r, c, forceMark = false) {
        e.preventDefault();
        const toolValue = forceMark || tool === 'mark' ? 2 : 1;
        // Pressing a cell that already has this mark clears it; the drag paints the same result.
        const value = gridRef.current[r][c] === toolValue ? 0 : toolValue;
        drag.current = { value };
        paint(r, c, value);
    }

    // One handler on the grid, so dragging also works with touch (where pointerenter on other cells never fires).
    function move(e) {
        if (!drag.current) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest?.('[data-cell]');
        if (!cell) return;
        const [r, c] = cell.dataset.cell.split(',').map(Number);
        paint(r, c, drag.current.value);
    }

    const solvedRows = rowClues.map((_, i) => lineDone(grid, puzzle, 'row', i));
    const solvedCols = colClues.map((_, i) => lineDone(grid, puzzle, 'col', i));

    return (
        <div className="puzzle-area">
            <div className="game-status">
                <span><strong>{solvedRows.filter(Boolean).length + solvedCols.filter(Boolean).length}</strong> / {size * 2} lines match</span>
            </div>

            <div className="pixel-wrap" style={{ '--px-size': size }}>
                <div className="pixel-corner" />
                <div className="pixel-col-clues" style={{ gridTemplateColumns: `repeat(${size}, var(--px-cell))` }}>
                    {colClues.map((clue, i) => (
                        <div key={i} className={`pixel-clue col ${solvedCols[i] ? 'done' : ''}`}>
                            {clue.map((n, k) => <span key={k}>{n}</span>)}
                        </div>
                    ))}
                </div>
                <div className="pixel-row-clues">
                    {rowClues.map((clue, i) => (
                        <div key={i} className={`pixel-clue row ${solvedRows[i] ? 'done' : ''}`}>
                            {clue.map((n, k) => <span key={k}>{n}</span>)}
                        </div>
                    ))}
                </div>
                <div
                    className="pixel-grid"
                    style={{ gridTemplateColumns: `repeat(${size}, var(--px-cell))` }}
                    onPointerMove={move}
                >
                    {grid.map((row, r) => row.map((v, c) => (
                        <button
                            key={`${r}-${c}`}
                            type="button"
                            data-cell={`${r},${c}`}
                            className={`pixel-cell ${v === 1 ? 'filled' : ''} ${v === 2 ? 'marked' : ''} ${hinted.has(r * size + c) ? 'hinted' : ''} ${(c + 1) % 5 === 0 && c < size - 1 ? 'sep-r' : ''} ${(r + 1) % 5 === 0 && r < size - 1 ? 'sep-b' : ''}`}
                            aria-label={`Row ${r + 1}, column ${c + 1}: ${v === 1 ? 'filled' : v === 2 ? 'marked empty' : 'unknown'}`}
                            onPointerDown={(e) => start(e, r, c, e.button === 2)}
                            onContextMenu={(e) => e.preventDefault()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); paint(r, c, v === 1 ? 0 : 1); }
                                if (e.key === 'x' || e.key === 'X') { e.preventDefault(); paint(r, c, v === 2 ? 0 : 2); }
                            }}
                        />
                    )))}
                </div>
            </div>

            <div className="game-tools">
                <div className="segmented" role="group" aria-label="Tool">
                    <button type="button" className={tool === 'fill' ? 'active' : ''} onClick={() => setTool('fill')}>Fill</button>
                    <button type="button" className={tool === 'mark' ? 'active' : ''} onClick={() => setTool('mark')}>Mark ✕</button>
                </div>
                <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => replaceGrid(Array.from({ length: size }, () => Array(size).fill(0)))}>
                    <RotateCcw size={14} strokeWidth={1.5} /> Clear
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 420 }}>
                Each number is the length of a run of filled cells in that row or column, in order. Runs are separated by at
                least one empty cell. Click or drag to fill; right-click (or use Mark) to note a cell you know is empty.
                A clue turns green when its line matches.
            </p>
        </div>
    );
}
