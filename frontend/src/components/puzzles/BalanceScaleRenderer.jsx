import React, { useMemo, useState } from 'react';
import { panWeight } from '../../engine/types/balanceScale.js';

const STAR = '10,1 12.6,7.2 19.3,7.6 14.2,12 15.9,18.6 10,15 4.1,18.6 5.8,12 0.7,7.6 7.4,7.2';

/** A shape drawn in a 20×20 box at (x, y) (top-left). */
function Glyph({ shape, x = 0, y = 0, color, size = 20 }) {
    const s = size / 20;
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="1">
            {shape === 'circle' && <circle cx="10" cy="10" r="9" />}
            {shape === 'triangle' && <polygon points="10,1 19,18 1,18" />}
            {shape === 'square' && <rect x="2" y="2" width="16" height="16" rx="2" />}
            {shape === 'star' && <polygon points={STAR} />}
        </g>
    );
}

const colorOf = (puzzle, id) => puzzle.shapes.find(s => s.id === id)?.color;

const PIVOT_X = 170;
const PIVOT_Y = 28;
const ARM = 112;
const ITEM = 20;

function Pan({ items, puzzle, cx, cy, total }) {
    const width = Math.max(76, items.length * (ITEM + 4) + 8);
    const rowY = cy - ITEM - 3;
    const startX = cx - (items.length * (ITEM + 4) - 4) / 2;
    return (
        <g>
            <line className="scale-string" x1={cx - width / 2 + 6} y1={cy} x2={cx} y2={cy - 34} />
            <line className="scale-string" x1={cx + width / 2 - 6} y1={cy} x2={cx} y2={cy - 34} />
            {items.map((item, k) => item.kind === 'num' ? (
                <g key={k}>
                    <rect x={startX + k * (ITEM + 4)} y={rowY} width={ITEM} height={ITEM} rx="3" className="scale-block" />
                    <text x={startX + k * (ITEM + 4) + ITEM / 2} y={rowY + 14} className="scale-block-text" textAnchor="middle">{item.value}</text>
                </g>
            ) : (
                <Glyph key={k} shape={item.id} color={colorOf(puzzle, item.id)} x={startX + k * (ITEM + 4)} y={rowY} size={ITEM} />
            ))}
            <path className="scale-pan" d={`M${cx - width / 2} ${cy} h${width} q-6 12 -${width / 2} 12 q-${width / 2 - 6} 0 -${width / 2} -12z`} />
            {total !== null && <text className="scale-total" x={cx} y={cy + 30} textAnchor="middle">{total}</text>}
        </g>
    );
}

function Scale({ scale, puzzle, weights }) {
    const left = panWeight(scale.left, weights);
    const right = panWeight(scale.right, weights);
    const known = left !== null && right !== null;
    const balanced = known && left === right;
    const angle = known ? Math.max(-14, Math.min(14, (right - left) * 3)) : 0;
    const rad = (angle * Math.PI) / 180;
    const lx = PIVOT_X - ARM * Math.cos(rad), ly = PIVOT_Y - ARM * Math.sin(rad);
    const rx = PIVOT_X + ARM * Math.cos(rad), ry = PIVOT_Y + ARM * Math.sin(rad);

    return (
        <svg className={`scale-svg ${balanced ? 'balanced' : ''}`} viewBox="0 0 340 150" role="img"
            aria-label={known ? (balanced ? 'Balanced' : right > left ? 'Right side heavier' : 'Left side heavier') : 'Set every weight to see this scale'}>
            <polygon className="scale-stand" points={`${PIVOT_X},${PIVOT_Y} ${PIVOT_X - 12},${PIVOT_Y + 100} ${PIVOT_X + 12},${PIVOT_Y + 100}`} />
            <line className="scale-beam" x1={lx} y1={ly} x2={rx} y2={ry} />
            <circle className="scale-pivot" cx={PIVOT_X} cy={PIVOT_Y} r="6" />
            <Pan items={scale.left} puzzle={puzzle} cx={lx} cy={ly + 36} total={left} />
            <Pan items={scale.right} puzzle={puzzle} cx={rx} cy={ry + 36} total={right} />
            <rect className="scale-base" x={PIVOT_X - 36} y={PIVOT_Y + 100} width="72" height="8" rx="4" />
        </svg>
    );
}

export default function BalanceScaleRenderer({ puzzle, onAnswer, highlight }) {
    const [raw, setRaw] = useState({});
    const hinted = new Set(highlight?.shapes || []);

    const weights = useMemo(() => {
        const w = {};
        for (const s of puzzle.shapes) {
            const n = parseInt(raw[s.id], 10);
            if (Number.isInteger(n) && n > 0) w[s.id] = n;
        }
        return w;
    }, [raw, puzzle.shapes]);

    function setShape(id, value) {
        const cleaned = value.replace(/[^0-9]/g, '').slice(0, 2);
        const next = { ...raw, [id]: cleaned };
        setRaw(next);
        const w = {};
        for (const s of puzzle.shapes) {
            const n = parseInt(next[s.id], 10);
            if (Number.isInteger(n) && n > 0) w[s.id] = n;
        }
        onAnswer({ weights: w });
    }

    function step(id, delta) {
        const cur = parseInt(raw[id], 10) || 0;
        setShape(id, String(Math.max(1, Math.min(puzzle.maxWeight, cur + delta))));
    }

    const balancedCount = puzzle.scales.filter(s => {
        const l = panWeight(s.left, weights), r = panWeight(s.right, weights);
        return l !== null && l === r;
    }).length;

    return (
        <div className="puzzle-area">
            <div className="game-status">
                <span><strong>{balancedCount}</strong> / {puzzle.scales.length} scales balanced</span>
            </div>

            <div className="scale-list">
                {puzzle.scales.map((s, i) => <Scale key={i} scale={s} puzzle={puzzle} weights={weights} />)}
            </div>

            <div className="weight-panel">
                <div className="weight-title">What does each shape weigh? (1–{puzzle.maxWeight})</div>
                {puzzle.shapes.map(s => (
                    <div key={s.id} className={`weight-row ${hinted.has(s.id) ? 'hinted' : ''}`}>
                        <svg width="26" height="26" viewBox="-3 -3 26 26" aria-hidden="true">
                            <Glyph shape={s.id} color={s.color} />
                        </svg>
                        <span className="weight-name">{s.name}</span>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => step(s.id, -1)} aria-label={`Decrease ${s.name} weight`}>−</button>
                        <input
                            className="weight-input"
                            inputMode="numeric"
                            aria-label={`${s.name} weight`}
                            placeholder="?"
                            value={raw[s.id] ?? ''}
                            onChange={(e) => setShape(s.id, e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => step(s.id, 1)} aria-label={`Increase ${s.name} weight`}>+</button>
                    </div>
                ))}
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                Grey blocks show their weight. Each scale tilts once all its shapes have a weight, and turns green when balanced.
            </p>
        </div>
    );
}
