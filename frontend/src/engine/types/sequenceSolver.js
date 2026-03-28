import { randInt, shuffle } from '../../utils/seededRng.js';

/**
 * Sequence Solver — Math/logical number sequences.
 * Enhanced with more rule types and combined rules at expert difficulty.
 */

const RULES = [
    {
        name: 'arithmetic',
        gen: (rng) => {
            const start = randInt(1, 20, rng);
            const diff = randInt(2, 9, rng);
            return { fn: (i) => start + diff * i, label: `+${diff}` };
        },
    },
    {
        name: 'geometric',
        gen: (rng) => {
            const start = randInt(1, 5, rng);
            const ratio = randInt(2, 3, rng);
            return { fn: (i) => start * Math.pow(ratio, i), label: `×${ratio}` };
        },
    },
    {
        name: 'square',
        gen: (rng) => {
            const offset = randInt(0, 5, rng);
            return { fn: (i) => (i + 1 + offset) * (i + 1 + offset), label: 'n²' };
        },
    },
    {
        name: 'triangular',
        gen: (rng) => {
            const mult = randInt(1, 3, rng);
            return { fn: (i) => mult * ((i + 1) * (i + 2)) / 2, label: 'triangular' };
        },
    },
    {
        name: 'fibonacci-like',
        gen: (rng) => {
            const a = randInt(1, 5, rng);
            const b = randInt(1, 5, rng);
            const seq = [a, b];
            for (let i = 2; i < 10; i++) seq.push(seq[i - 1] + seq[i - 2]);
            return { fn: (i) => seq[i], label: 'fib' };
        },
    },
    {
        name: 'alternating-add',
        gen: (rng) => {
            const start = randInt(1, 10, rng);
            const add1 = randInt(2, 5, rng);
            const add2 = randInt(3, 7, rng);
            const seq = [start];
            for (let i = 1; i < 10; i++) seq.push(seq[i - 1] + (i % 2 === 1 ? add1 : add2));
            return { fn: (i) => seq[i], label: `+${add1}/+${add2}` };
        },
    },
    {
        name: 'powers',
        gen: (rng) => {
            const base = randInt(2, 4, rng);
            const offset = randInt(0, 3, rng);
            return { fn: (i) => Math.pow(base, i + 1) + offset, label: `${base}^n` };
        },
    },
    {
        name: 'cumulative-sum',
        gen: (rng) => {
            const start = randInt(1, 5, rng);
            const step = randInt(1, 3, rng);
            const seq = [start];
            for (let i = 1; i < 10; i++) seq.push(seq[i - 1] + (start + step * i));
            return { fn: (i) => seq[i], label: 'cumulative' };
        },
    },
    {
        name: 'multiply-add',
        gen: (rng) => {
            const start = randInt(1, 5, rng);
            const mult = randInt(2, 3, rng);
            const add = randInt(1, 4, rng);
            const seq = [start];
            for (let i = 1; i < 10; i++) seq.push(seq[i - 1] * mult + add);
            return { fn: (i) => seq[i], label: `×${mult}+${add}` };
        },
    },
    {
        name: 'difference-grows',
        gen: (rng) => {
            const start = randInt(1, 8, rng);
            const baseDiff = randInt(1, 3, rng);
            const seq = [start];
            for (let i = 1; i < 10; i++) seq.push(seq[i - 1] + baseDiff + i);
            return { fn: (i) => seq[i], label: `+n` };
        },
    },
];

export function generate(rng, difficulty = 1) {
    const numRounds = Math.min(2 + Math.floor(difficulty), 5);
    const rounds = [];

    // At higher difficulty use more complex rules
    const availableRules = difficulty >= 1.5 ? RULES : RULES.slice(0, 7);

    for (let r = 0; r < numRounds; r++) {
        const ruleIdx = randInt(0, availableRules.length - 1, rng);
        const rule = availableRules[ruleIdx];
        const { fn, label } = rule.gen(rng);

        const length = randInt(5, 7, rng);
        const sequence = [];
        for (let i = 0; i < length; i++) sequence.push(fn(i));

        // Choose blanks based on difficulty
        const blankCount = difficulty >= 1.5 ? 2 : 1;
        const positions = Array.from({ length }, (_, i) => i);
        const blankable = positions.filter(i => i >= 2);
        shuffle(blankable, rng);
        const blanks = blankable.slice(0, blankCount).sort((a, b) => a - b);

        rounds.push({
            sequence,
            blanks,
            ruleName: rule.name,
            ruleLabel: label,
        });
    }

    return {
        type: 'sequenceSolver',
        rounds,
        totalRounds: numRounds,
    };
}

export function validate(userAnswers, puzzleData) {
    return puzzleData.rounds.every((round, ri) => {
        return round.blanks.every((blankIdx, bi) => {
            const key = `${ri}-${bi}`;
            return parseInt(userAnswers[key]) === round.sequence[blankIdx];
        });
    });
}

export function getHint(puzzleData, currentRound) {
    if (currentRound >= puzzleData.rounds.length) return null;
    const round = puzzleData.rounds[currentRound];
    return { ruleLabel: round.ruleLabel, ruleName: round.ruleName };
}
