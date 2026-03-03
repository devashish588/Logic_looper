import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function QuantumGridRenderer({ puzzle, onAnswer }) {
    const { size, symbols, puzzle: grid, given } = puzzle;
    const [userGrid, setUserGrid] = useState(grid.map((row) => [...row]));
    const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);

    function handleCellClick(r, c) {
        if (given[r][c]) return;
        const newGrid = userGrid.map((row) => [...row]);

        if (newGrid[r][c] === selectedSymbol) {
            // Deselect
            newGrid[r][c] = null;
        } else {
            newGrid[r][c] = selectedSymbol;
        }

        setUserGrid(newGrid);
        onAnswer(newGrid);
    }

    return (
        <div className="puzzle-area">
            {/* Symbol palette */}
            <div className="quantum-palette">
                {symbols.map((sym) => (
                    <button
                        key={sym}
                        className={`quantum-symbol-btn ${selectedSymbol === sym ? 'active' : ''}`}
                        onClick={() => setSelectedSymbol(sym)}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div
                className="puzzle-grid quantum-grid"
                style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
                {userGrid.map((row, r) =>
                    row.map((val, c) => (
                        <motion.div
                            key={`${r}-${c}`}
                            className={`puzzle-cell quantum-cell ${given[r][c] ? 'given' : ''}`}
                            whileTap={!given[r][c] ? { scale: 0.9 } : {}}
                            onClick={() => handleCellClick(r, c)}
                        >
                            {val || ''}
                        </motion.div>
                    )),
                )}
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem' }}>
                Select a symbol above, then tap cells to place it. Every row and column
                must contain each symbol exactly once.
            </p>
        </div>
    );
}
