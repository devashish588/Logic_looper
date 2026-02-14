import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function NumberMatrixRenderer({ puzzle, onAnswer }) {
    const { size, puzzle: grid, given } = puzzle;
    const [userGrid, setUserGrid] = useState(
        grid.map(row => [...row])
    );
    const [selected, setSelected] = useState(null);

    function handleCellChange(r, c, value) {
        if (given[r][c]) return;
        const num = parseInt(value);
        const newGrid = userGrid.map(row => [...row]);
        newGrid[r][c] = isNaN(num) ? 0 : Math.min(num, size);
        setUserGrid(newGrid);
        onAnswer(newGrid);
    }

    return (
        <div className="puzzle-area">
            <div
                className="puzzle-grid"
                style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
                {userGrid.map((row, r) =>
                    row.map((val, c) => (
                        <motion.div
                            key={`${r}-${c}`}
                            className={`puzzle-cell ${given[r][c] ? 'given' : ''} ${selected?.r === r && selected?.c === c ? 'selected' : ''
                                }`}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !given[r][c] && setSelected({ r, c })}
                        >
                            {given[r][c] ? (
                                val
                            ) : (
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={val || ''}
                                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                                    onFocus={() => setSelected({ r, c })}
                                />
                            )}
                        </motion.div>
                    ))
                )}
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem' }}>
                Fill each cell with 1–{size}. Every row and column must have unique numbers.
            </p>
        </div>
    );
}
