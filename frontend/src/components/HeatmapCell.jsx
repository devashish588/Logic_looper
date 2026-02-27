import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const INTENSITY_COLORS = {
  0: '#2a2060', // Empty — subtle navy hint (not harsh white)
  1: '#C2D9FF', // Low — light brand blue
  2: '#BFCFE7', // Medium
  3: '#525CEB', // Medium-high
  4: '#414BEA', // More — brand primary blue
};

const PULSE_COLOR = '#414BEA';

/**
 * Memoized individual heatmap cell.
 * Tooltip is rendered via a React Portal at position:fixed — fully immune to parent overflow clipping.
 */
const HeatmapCell = React.memo(function HeatmapCell({
  date,
  score,
  intensity,
  puzzleType,
  isToday,
  justSolved,
}) {
  const [tooltip, setTooltip] = useState(null); // { x, y }
  const cellRef = useRef(null);

  const handleMouseEnter = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const FLIP_THRESHOLD = 150; // px from top before flipping below
    const above = rect.top > FLIP_THRESHOLD;
    setTooltip({
      x: rect.left + rect.width / 2,
      y: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const FLIP_THRESHOLD = 150;
    const above = rect.top > FLIP_THRESHOLD;
    setTooltip({
      x: rect.left + rect.width / 2,
      y: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  }, []);

  const bgColor = INTENSITY_COLORS[intensity] ?? INTENSITY_COLORS[0];

  const difficultyLabel = puzzleType
    ? puzzleType.replace(/([A-Z])/g, ' $1').trim()
    : 'Not played';

  const tooltipEl = tooltip && createPortal(
    <AnimatePresence>
      <motion.div
        key="heatmap-tt"
        initial={{ opacity: 0, y: 4, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: tooltip.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)',
          background: 'linear-gradient(135deg, #414BEA 0%, #7752FE 100%)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
          minWidth: '130px',
          pointerEvents: 'none',
          zIndex: 99999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '5px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          paddingBottom: '4px',
          letterSpacing: '0.02em',
        }}>
          {date}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.8)',
          padding: '1px 0',
        }}>
          <span>Score</span>
          <strong style={{ color: '#fff' }}>{score || 0}</strong>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.8)',
          padding: '1px 0',
        }}>
          <span>Type</span>
          <strong style={{ color: '#fff' }}>{difficultyLabel}</strong>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <div
        ref={cellRef}
        className="heatmap-cell-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
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
      </div>
      {tooltipEl}
    </>
  );
});

export default HeatmapCell;
