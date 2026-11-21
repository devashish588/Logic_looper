import React, { useMemo, useState } from 'react';
import { trace, sameEdge } from '../../engine/types/laserPath.js';
import { RotateCcw } from '../Icons.jsx';

const CELL = 56;
const PAD = 30;

function edgePoint(edge, size) {
    const along = PAD + edge.index * CELL + CELL / 2;
    switch (edge.side) {
        case 'left': return { x: PAD, y: along };
        case 'right': return { x: PAD + size * CELL, y: along };
        case 'top': return { x: along, y: PAD };
        default: return { x: along, y: PAD + size * CELL };
    }
}

const center = ({ r, c }) => ({ x: PAD + c * CELL + CELL / 2, y: PAD + r * CELL + CELL / 2 });

// Arrow pointing in the direction the laser travels, drawn just outside the edge.
function Marker({ edge, size, kind }) {
    const p = edgePoint(edge, size);
    const outward = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] }[edge.side];
    const cx = p.x + outward[0] * 14;
    const cy = p.y + outward[1] * 14;
    if (kind === 'target') {
        return (
            <g className="laser-target">
                <circle cx={cx} cy={cy} r="9" />
                <circle cx={cx} cy={cy} r="4" />
            </g>
        );
    }
    // Source: a small emitter pointing inward
    const inward = [-outward[0], -outward[1]];
    const tip = { x: cx + inward[0] * 8, y: cy + inward[1] * 8 };
    const perp = [-inward[1], inward[0]];
    const a = { x: cx - inward[0] * 6 + perp[0] * 7, y: cy - inward[1] * 6 + perp[1] * 7 };
    const b = { x: cx - inward[0] * 6 - perp[0] * 7, y: cy - inward[1] * 6 - perp[1] * 7 };
    return <polygon className="laser-source" points={`${tip.x},${tip.y} ${a.x},${a.y} ${b.x},${b.y}`} />;
}

export default function LaserPathRenderer({ puzzle, onAnswer, highlight }) {
    const { size, source, target, mirrors, blockers } = puzzle;
    const initial = useMemo(() => mirrors.map(m => m.initial), [mirrors]);
    const [orientation, setOrientation] = useState(initial);
    const hinted = new Set(highlight?.cells || []);

    const t = useMemo(() => trace(puzzle, orientation), [puzzle, orientation]);
    const hit = sameEdge(t.exit, target);

    const beam = useMemo(() => {
        const pts = [edgePoint(source, size), ...t.cells.map(center)];
        if (t.exit) pts.push(edgePoint(t.exit, size));
        return pts.map(p => `${p.x},${p.y}`).join(' ');
    }, [t, source, size]);

    function toggle(i) {
        const next = orientation.map((o, k) => (k === i ? (o === '/' ? '\\' : '/') : o));
        setOrientation(next);
        onAnswer({ orientation: next });
    }

    const total = PAD * 2 + size * CELL;

    return (
        <div className="puzzle-area">
            <div className="game-status">
                <span className={hit ? 'status-good' : ''}>{hit ? 'Target hit!' : t.blockedAt ? 'Beam blocked' : 'Beam misses the target'}</span>
            </div>

            <svg className="laser-board" viewBox={`0 0 ${total} ${total}`} role="group"
                aria-label="Laser board. Click a mirror to turn it.">
                {Array.from({ length: size * size }, (_, i) => {
                    const r = Math.floor(i / size), c = i % size;
                    return <rect key={i} className="laser-cell" x={PAD + c * CELL} y={PAD + r * CELL} width={CELL} height={CELL} />;
                })}

                {blockers.map(b => (
                    <g key={`${b.r}-${b.c}`} className="laser-block">
                        <rect x={PAD + b.c * CELL + 6} y={PAD + b.r * CELL + 6} width={CELL - 12} height={CELL - 12} rx="6" />
                        <path d={`M${PAD + b.c * CELL + 18} ${PAD + b.r * CELL + 18}l${CELL - 36} ${CELL - 36}m0 -${CELL - 36}l-${CELL - 36} ${CELL - 36}`} />
                    </g>
                ))}

                <polyline className={`laser-beam ${hit ? 'hit' : ''}`} points={beam} />

                {mirrors.map((m, i) => {
                    const x = PAD + m.c * CELL, y = PAD + m.r * CELL;
                    const slash = orientation[i] === '/';
                    return (
                        <g
                            key={i}
                            className={`laser-mirror ${hinted.has(m.r * size + m.c) ? 'hinted' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Mirror at row ${m.r + 1}, column ${m.c + 1}, leaning ${slash ? 'right' : 'left'}. Activate to turn.`}
                            onClick={() => toggle(i)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
                        >
                            <rect x={x} y={y} width={CELL} height={CELL} fill="transparent" />
                            <line
                                x1={x + 10} y1={slash ? y + CELL - 10 : y + 10}
                                x2={x + CELL - 10} y2={slash ? y + 10 : y + CELL - 10}
                            />
                        </g>
                    );
                })}

                <Marker edge={source} size={size} kind="source" />
                <Marker edge={target} size={size} kind="target" />
            </svg>

            <div className="game-tools">
                <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => { setOrientation(initial); onAnswer({ orientation: initial }); }}>
                    <RotateCcw size={14} strokeWidth={1.5} /> Reset mirrors
                </button>
            </div>
            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                Click a mirror to flip it between / and \. Steer the beam from the emitter (triangle) into the target (ring).
                Dark blocks stop the beam.
            </p>
        </div>
    );
}
