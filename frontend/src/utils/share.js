import { PUZZLE_LABELS } from './constants.js';

/** Puzzle #1 is 2026-01-01; the number makes shared results easy to compare. */
const EPOCH = Date.UTC(2026, 0, 1);

export function puzzleNumber(date) {
    return Math.floor((Date.parse(`${date}T00:00:00Z`) - EPOCH) / 86400000) + 1;
}

/**
 * Spoiler-free result squares, one per action, in the order:
 * hints (yellow), wrong submissions (red), then the solve (green).
 * Capped so a rough day doesn't produce a wall of squares.
 */
export function resultSquares({ hintsUsed = 0, mistakes = 0 }) {
    const squares = [
        ...Array(Math.min(hintsUsed, 5)).fill('hint'),
        ...Array(Math.min(mistakes, 6)).fill('miss'),
        'solve',
    ];
    return squares;
}

const EMOJI = { hint: '🟨', miss: '🟥', solve: '🟩' };

export function formatClock(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Wordle-style share text. Reveals how it went, never the answer.
 *
 *   Logic Looper #326 · Binary Logic
 *   🟨🟥🟩 1:42 · 70 pts
 *   🔥 12-day streak
 *   https://…
 */
export function buildShareText({ date, puzzleType, timeSeconds, hintsUsed, mistakes, points, streak }) {
    const squares = resultSquares({ hintsUsed, mistakes }).map(k => EMOJI[k]).join('');
    const lines = [
        `Logic Looper #${puzzleNumber(date)} · ${PUZZLE_LABELS[puzzleType] || puzzleType}`,
        `${squares} ${timeSeconds ? `${formatClock(timeSeconds)} · ` : ''}${points} pts`,
    ];
    if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
    if (typeof window !== 'undefined') lines.push(window.location.origin);
    return lines.join('\n');
}
