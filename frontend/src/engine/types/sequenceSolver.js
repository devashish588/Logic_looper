import { randInt, shuffle } from '../../utils/seededRng.js';

/**
 * Sequence Solver — Mathematical/logical number sequences.
 * Player fills in the missing term(s).
 */

const RULES = [
    // [name, generator fn]
    {
        name: 'arithmetic',
        gen: (rng) => {
            const start = randInt(1, 20, rng);
            const diff = randInt(2, 8, rng);
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
            for (let i = 2; i < 8; i++) seq.push(seq[i - 1] + seq[i - 2]);
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
            for (let i = 1; i < 8; i++) seq.push(seq[i - 1] + (i % 2 === 1 ? add1 : add2));
            return { fn: (i) => seq[i], label: `+${add1}/+${add2}` };
        },
    },
];

export function generate(rng, difficulty = 1) {
    const numRounds = Math.min(2 + Math.floor(difficulty), 5);
    const rounds = [];

    for (let r = 0; r < numRounds; r++) {
        const ruleIdx = randInt(0, RULES.length - 1, rng);
        const rule = RULES[ruleIdx];
        const { fn, label } = rule.gen(rng);

        const length = randInt(5, 7, rng);
        const sequence = [];
        for (let i = 0; i < length; i++) sequence.push(fn(i));

        // Choose 1-2 blanks
        const blankCount = difficulty >= 2 ? 2 : 1;
        const positions = Array.from({ length }, (_, i) => i);
        // Don't blank the first two entries (too hard to guess rule)
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
