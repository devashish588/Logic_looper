import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTENSITY_COLORS = {
    0: 'rgba(246, 231, 188, 0.4)', // #F6E7BC at 40%
    1: '#0992C2',
    2: '#0773A0',
    3: '#054F7E',
    4: '#0B2D72',
};

const PULSE_COLOR = '#0AC4E0';

/**
 * Memoized individual heatmap cell.
 * Shows tooltip on hover, and pulses when `justSolved` is true for today's cell.
 */
const HeatmapCell = React.memo(function HeatmapCell({
    date,
    score,
    intensity,
    puzzleType,
    isToday,
    justSolved,
}) {
    const [hovered, setHovered] = useState(false);

    const bgColor = INTENSITY_COLORS[intensity] || INTENSITY_COLORS[0];

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    // Difficulty label from puzzle type
    const difficultyLabel = puzzleType
        ? puzzleType.replace(/([A-Z])/g, ' $1').trim()
        : 'Not played';

    return (
        <div
            className="heatmap-cell-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="heatmap-cell"
                style={{ backgroundColor: bgColor }}
                animate={
                    isToday && justSolved
                        ? {
                            scale: [1, 1.4, 1],
                            boxShadow: [
                                `0 0 0px ${PULSE_COLOR}`,
                                `0 0 12px ${PULSE_COLOR}`,
                                `0 0 0px ${PULSE_COLOR}`,
                            ],
                        }
                        : { scale: 1 }
                }
                transition={
                    isToday && justSolved
                        ? { duration: 0.8, repeat: 2, ease: 'easeInOut' }
                        : {}
                }
            />

            {/* Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        className="heatmap-tooltip"
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="heatmap-tooltip-date">{date}</div>
                        <div className="heatmap-tooltip-row">
                            <span>Score</span>
                            <strong>{score || 0}</strong>
                        </div>
                        <div className="heatmap-tooltip-row">
                            <span>Type</span>
                            <strong>{difficultyLabel}</strong>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default HeatmapCell;
