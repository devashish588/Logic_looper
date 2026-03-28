import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bluestock-branded color palette for heatmap intensity.
 * 0 = no activity, 1-2 = light, 3-4 = brand blue, 5+ = brand orange (peak streak)
 */
const INTENSITY_COLORS = {
    0: 'rgba(148, 163, 184, 0.12)',  // slate-400 at 12%
    1: '#93C5FD',                     // blue-300
    2: '#60A5FA',                     // blue-400
    3: '#414BEA',                     // Bluestock Blue
    4: '#3730A3',                     // indigo-800
    5: '#F05537',                     // Bluestock Orange — peak
};

function getIntensityColor(score) {
    if (!score || score <= 0) return INTENSITY_COLORS[0];
    if (score < 30) return INTENSITY_COLORS[1];
    if (score < 60) return INTENSITY_COLORS[2];
    if (score < 90) return INTENSITY_COLORS[3];
    if (score < 100) return INTENSITY_COLORS[4];
    return INTENSITY_COLORS[5]; // 100+ = peak
}

const PULSE_COLOR = '#414BEA';

/**
 * HeatmapCell with:
 * - Bluestock color palette
 * - Intelligent edge detection: flips tooltip to the left when near right edge
 * - Theme-aware tooltip with blur + border
 * - Touch support for mobile
 */
const HeatmapCell = React.memo(function HeatmapCell({
    date,
    score,
    intensity,
    puzzleType,
    isToday,
    justSolved,
    weekIndex,
    totalWeeks,
}) {
    const [hovered, setHovered] = useState(false);
    const wrapperRef = useRef(null);

    const bgColor = getIntensityColor(score);

    // Edge detection: flip tooltip when in the last 10 weeks
    const isNearRightEdge = totalWeeks - weekIndex <= 10;
    // Also check left edge for the first 4 weeks
    const isNearLeftEdge = weekIndex <= 3;

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);
    const handleTouchStart = useCallback((e) => {
        e.stopPropagation();
        setHovered(true);
        setTimeout(() => setHovered(false), 2200);
    }, []);

    const difficultyLabel = puzzleType
        ? puzzleType.replace(/([A-Z])/g, ' $1').trim()
        : 'No activity';

    // Tooltip position classes
    const tooltipAlign = isNearRightEdge
        ? 'tooltip-flip-left'
        : isNearLeftEdge
            ? 'tooltip-flip-right'
            : 'tooltip-center';

    return (
        <div
            ref={wrapperRef}
            className="heatmap-cell-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
        >
            <motion.div
                className={`heatmap-cell ${isToday ? 'heatmap-cell-today' : ''}`}
                style={{ backgroundColor: bgColor }}
                animate={
                    isToday && justSolved
                        ? {
                            scale: [1, 1.5, 1],
                            boxShadow: [
                                `0 0 0px ${PULSE_COLOR}`,
                                `0 0 14px ${PULSE_COLOR}`,
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

            {/* Adaptive Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        className={`heatmap-tooltip ${tooltipAlign}`}
                        initial={{ opacity: 0, y: 4, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.92 }}
                        transition={{ duration: 0.12 }}
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
                        {isToday && (
                            <div className="heatmap-tooltip-today">Today</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export { getIntensityColor, INTENSITY_COLORS };
export default HeatmapCell;
