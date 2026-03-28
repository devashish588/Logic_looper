import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const BLUESTOCK_ORANGE = '#F05537';

export default function NumberMatrixRenderer({ puzzle, onAnswer }) {
    const { size, puzzle: grid, given } = puzzle;
    const [userGrid, setUserGrid] = useState(
        grid.map(row => [...row])
    );
    const [selected, setSelected] = useState(null);
    const hintedCells = useSelector(state => state.game.hintedCells);

    // Track which cells have been hinted for animation
    const hintedMap = useMemo(() => {
        const map = {};
        hintedCells.forEach(h => {
            if (h.type === 'cell') {
                map[`${h.row}-${h.col}`] = h.value;
            }
        });
        return map;
    }, [hintedCells]);

    // Apply hint values to grid when new hints arrive
    useEffect(() => {
        let changed = false;
        const newGrid = userGrid.map(row => [...row]);
        for (const hint of hintedCells) {
            if (hint.type === 'cell' && newGrid[hint.row][hint.col] !== hint.value) {
                newGrid[hint.row][hint.col] = hint.value;
                changed = true;
            }
        }
        if (changed) {
            setUserGrid(newGrid);
            onAnswer(newGrid);
        }
    }, [hintedCells]);

    const handleCellChange = useCallback((r, c, value) => {
        if (given[r][c]) return;
        if (hintedMap[`${r}-${c}`]) return; // Can't overwrite hinted cells
        const num = parseInt(value);
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = isNaN(num) ? 0 : Math.min(num, size);
        setUserGrid(newGrid);
        onAnswer(newGrid);
    }, [given, size, userGrid, onAnswer, hintedMap]);

    const handleNumberPad = useCallback((num) => {
        if (!selected) return;
        const { r, c } = selected;
        if (given[r][c]) return;
        if (hintedMap[`${r}-${c}`]) return; // Can't overwrite hinted cells
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = num;
        setUserGrid(newGrid);
        onAnswer(newGrid);
    }, [selected, given, userGrid, onAnswer, hintedMap]);

    const handleClear = useCallback(() => {
        if (!selected) return;
        const { r, c } = selected;
        if (given[r][c]) return;
        if (hintedMap[`${r}-${c}`]) return; // Can't clear hinted cells
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = 0;
        setUserGrid(newGrid);
        onAnswer(newGrid);
    }, [selected, given, userGrid, onAnswer, hintedMap]);

    // Check for conflicts in row/col
    const getConflicts = (r, c) => {
        const val = userGrid[r][c];
        if (!val || given[r][c]) return false;
        // Check row
        for (let i = 0; i < size; i++) {
            if (i !== c && userGrid[r][i] === val) return true;
        }
        // Check col
        for (let i = 0; i < size; i++) {
            if (i !== r && userGrid[i][c] === val) return true;
        }
        return false;
    };

    const cellSize = size <= 4 ? 56 : size <= 5 ? 50 : 44;

    return (
        <div className="puzzle-area">
            <div
                className="puzzle-grid"
                style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
                {userGrid.map((row, r) =>
                    row.map((val, c) => {
                        const isSelected = selected?.r === r && selected?.c === c;
                        const isHighlightRow = selected && selected.r === r;
                        const isHighlightCol = selected && selected.c === c;
                        const hasConflict = getConflicts(r, c);
                        const isHinted = !!hintedMap[`${r}-${c}`];

                        return (
                            <motion.div
                                key={`${r}-${c}`}
                                className={[
                                    'puzzle-cell',
                                    given[r][c] ? 'given' : '',
                                    isSelected ? 'selected' : '',
                                    hasConflict ? 'error' : '',
                                    isHinted ? 'hinted' : '',
                                    !isSelected && (isHighlightRow || isHighlightCol) ? 'highlight-row' : '',
                                ].filter(Boolean).join(' ')}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    ...(isHinted ? {
                                        borderColor: BLUESTOCK_ORANGE,
                                        borderWidth: '2px',
                                        boxShadow: `0 0 12px ${BLUESTOCK_ORANGE}40`,
                                    } : {}),
                                }}
                                whileTap={!given[r][c] && !isHinted ? { scale: 0.93 } : {}}
                                onClick={() => !given[r][c] && !isHinted && setSelected({ r, c })}
                                // Animate hinted cells
                                animate={isHinted ? {
                                    scale: [1, 1.15, 1],
                                    borderColor: [BLUESTOCK_ORANGE, BLUESTOCK_ORANGE, BLUESTOCK_ORANGE],
                                } : {}}
                                transition={isHinted ? {
                                    duration: 0.5,
                                    ease: 'easeOut',
                                } : {}}
                            >
                                {given[r][c] || isHinted ? (
                                    <span style={isHinted ? { color: BLUESTOCK_ORANGE, fontWeight: 700 } : {}}>
                                        {val}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={val || ''}
                                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                                        onFocus={() => setSelected({ r, c })}
                                        readOnly={window.innerWidth < 768}
                                    />
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Number Pad for mobile */}
            <div className="number-pad">
                {Array.from({ length: size }, (_, i) => i + 1).map(num => (
                    <button
                        key={num}
                        className="number-pad-btn"
                        onClick={() => handleNumberPad(num)}
                    >
                        {num}
                    </button>
                ))}
                <button
                    className="number-pad-btn clear-btn"
                    onClick={handleClear}
                >
                    ✕
                </button>
            </div>

            <p className="text-muted mt-16" style={{ fontSize: '0.78rem', textAlign: 'center' }}>
                Fill each cell with 1–{size}. Every row and column must have unique numbers.
            </p>
        </div>
    );
}
