import { shuffle, randInt, pickN } from '../../utils/seededRng.js';

/**
 * Balance Scales: every scale is balanced. Work out what each shape weighs.
 * Set a weight for every shape; the scales tilt live as you go.
 *
 * Clues are built as a chain (each one adds one new shape to ones already
 * determined) so the puzzle can be solved by substitution. Harder days start
 * with two shapes tangled together. The clue system is checked to have
 * exactly one solution, so "every scale balances" means "solved".
 */

export const SHAPES = [
    { id: 'circle', name: 'circle', color: '#FF6B6B' },
    { id: 'triangle', name: 'triangle', color: '#4ECDC4' },
    { id: 'square', name: 'square', color: '#F7DC6F' },
    { id: 'star', name: 'star', color: '#B794F6' },
];

/** Net weight of each pan, or null if a shape in it has no weight yet. */
export function panWeight(pan, weights) {
    let total = 0;
    for (const item of pan) {
        if (item.kind === 'num') total += item.value;
        else {
            const w = weights?.[item.id];
            if (!Number.isFinite(w)) return null;
            total += w;
        }
    }
    return total;
}

function determinant(matrix) {
    const m = matrix.map(row => [...row]);
    const n = m.length;
    let det = 1;
    for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
        if (Math.abs(m[pivot][col]) < 1e-9) return 0;
        if (pivot !== col) { [m[pivot], m[col]] = [m[col], m[pivot]]; det = -det; }
        det *= m[col][col];
        for (let r = col + 1; r < n; r++) {
            const f = m[r][col] / m[col][col];
            for (let k = col; k < n; k++) m[r][k] -= f * m[col][k];
        }
    }
    return det;
}

/** Build one balanced scale from shape counts, adding a number block to the lighter side. */
function makeScale(leftIds, rightIds, weights) {
    const left = leftIds.map(id => ({ kind: 'shape', id }));
    const right = rightIds.map(id => ({ kind: 'shape', id }));
    const diff = panWeight(left, weights) - panWeight(right, weights);
    if (diff > 0) right.push({ kind: 'num', value: diff });
    if (diff < 0) left.push({ kind: 'num', value: -diff });
    return { left, right };
}

function coefficients(scale, ids) {
    return ids.map(id =>
        scale.left.filter(i => i.kind === 'shape' && i.id === id).length -
        scale.right.filter(i => i.kind === 'shape' && i.id === id).length);
}

export function generate(rng, difficulty = 1) {
    const count = difficulty < 1.5 ? 3 : 4;
    const tangled = difficulty >= 1.7; // first two shapes only solvable together

    for (let attempt = 0; attempt < 100; attempt++) {
        const shapes = pickN(SHAPES, count, rng);
        const ids = shapes.map(s => s.id);
        const values = pickN([1, 2, 3, 4, 5, 6, 7, 8, 9], count, rng);
        const weights = Object.fromEntries(ids.map((id, i) => [id, values[i]]));
        const order = shuffle([...ids], rng); // the order a solver discovers them

        const scales = [];
        let k = 0;
        if (tangled) {
            const [a, b] = order;
            // a + b = n   and   2a = b + m  (or similar): solve together
            scales.push(makeScale([a, b], [], weights));
            scales.push(makeScale([a, a], [b], weights));
            k = 2;
        }
        for (; k < count; k++) {
            const fresh = order[k];
            const known = order.slice(0, k);
            const copies = randInt(1, k === 0 ? 3 : 2, rng);
            const left = Array(copies).fill(fresh);
            const right = [];
            // Mix in 0-2 already-known shapes, on either side
            const extras = known.length ? randInt(0, Math.min(2, known.length), rng) : 0;
            for (let e = 0; e < extras; e++) {
                const id = known[randInt(0, known.length - 1, rng)];
                (rng() < 0.5 ? left : right).push(id);
            }
            if (right.length === 0 && left.length === 1 && known.length && rng() < 0.6) {
                right.push(known[randInt(0, known.length - 1, rng)]);
            }
            scales.push(makeScale(left, right, weights));
        }

        // Exactly one solution, and no scale reads "0 = 0" style nonsense
        const matrix = scales.map(s => coefficients(s, ids));
        if (Math.abs(determinant(matrix)) < 1e-9) continue;
        if (scales.some(s => s.left.length === 0 || s.right.length === 0)) continue;
        if (scales.some(s => s.left.length + s.right.length > 6)) continue;

        return {
            type: 'balanceScale',
            shapes,
            scales: shuffle(scales, rng),
            solveOrder: order,
            solution: weights,
            maxWeight: 12,
            autoCheck: true,
        };
    }
    // Fallback (cannot realistically happen): a simple chain
    const shapes = SHAPES.slice(0, 3);
    const weights = { circle: 3, triangle: 5, square: 2 };
    return {
        type: 'balanceScale',
        shapes,
        scales: [
            makeScale(['circle', 'circle'], [], weights),
            makeScale(['triangle'], ['circle'], weights),
            makeScale(['square', 'square', 'circle'], ['triangle'], weights),
        ],
        solveOrder: ['circle', 'triangle', 'square'],
        solution: weights,
        maxWeight: 12,
        autoCheck: true,
    };
}

/** answer: { weights: { [shapeId]: number } }. Solved when every scale balances. */
export function validate(answer, puzzle) {
    const w = answer?.weights;
    if (!w) return false;
    if (!puzzle.shapes.every(s => Number.isInteger(w[s.id]) && w[s.id] > 0)) return false;
    return puzzle.scales.every(s => panWeight(s.left, w) === panWeight(s.right, w));
}

/** Reveal shapes in the order they can be deduced, skipping ones already right. */
export function getHint(puzzle, answer, hintIndex = 0) {
    const w = answer?.weights || {};
    const wrong = puzzle.solveOrder.filter(id => w[id] !== puzzle.solution[id]);
    if (!wrong.length) return null;
    const id = wrong[0];
    return { shape: id, weight: puzzle.solution[id], name: puzzle.shapes.find(s => s.id === id).name, hintIndex };
}
