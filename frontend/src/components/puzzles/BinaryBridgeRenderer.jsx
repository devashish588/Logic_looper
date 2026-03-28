import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function BinaryBridgeRenderer({ puzzle, onAnswer }) {
    const { size, grid, start, end, maxDiff } = puzzle;
    const [path, setPath] = useState([start]);

    const isInPath = useCallback(
        (r, c) => path.some(([pr, pc]) => pr === r && pc === c),
        [path],
    );

    const isAdjacent = (r, c) => {
        if (path.length === 0) return false;
        const [lr, lc] = path[path.length - 1];
        return Math.abs(r - lr) + Math.abs(c - lc) === 1;
    };

    const isValidStep = (r, c) => {
        if (path.length === 0) return r === start[0] && c === start[1];
        const [lr, lc] = path[path.length - 1];
        return (
            isAdjacent(r, c) &&
            !isInPath(r, c) &&
            Math.abs(grid[r][c] - grid[lr][lc]) <= maxDiff
        );
    };

    function handleClick(r, c) {
        // If clicking the last node in path, undo
        if (path.length > 1) {
            const [lr, lc] = path[path.length - 1];
            if (lr === r && lc === c) {
                const newPath = path.slice(0, -1);
                setPath(newPath);
                onAnswer(newPath);
                return;
            }
        }

        if (isValidStep(r, c)) {
            const newPath = [...path, [r, c]];
            setPath(newPath);
            onAnswer(newPath);
        }
    }

    function handleReset() {
        setPath([start]);
        onAnswer([start]);
    }

    return (
        <div className="puzzle-area">
            <div
                className="bridge-grid"
                style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
                {grid.map((row, r) =>
                    row.map((val, c) => {
                        const inPath = isInPath(r, c);
                        const isStart = r === start[0] && c === start[1];
                        const isEnd = r === end[0] && c === end[1];
                        const valid = !inPath && isValidStep(r, c);
                        const pathIdx = path.findIndex(([pr, pc]) => pr === r && pc === c);

                        return (
                            <motion.div
                                key={`${r}-${c}`}
                                className={[
                                    'bridge-cell',
                                    inPath ? 'in-path' : '',
                                    isStart ? 'start' : '',
                                    isEnd ? 'end' : '',
                                    valid ? 'valid-step' : '',
                                ].join(' ')}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleClick(r, c)}
                            >
                                <span className="bridge-cell-value">{val}</span>
                                {inPath && pathIdx >= 0 && (
                                    <span className="bridge-cell-order">{pathIdx + 1}</span>
                                )}
                            </motion.div>
                        );
                    }),
                )}
            </div>
            <div className="flex-center gap-8 mt-16">
                <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                    Reset Path
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem' }}>
                Build a path from 🟢 to 🔴. Adjacent steps must differ by ≤ {maxDiff}.
            </p>
        </div>
    );
}
