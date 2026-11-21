// Every puzzle type that can come up from now on, in display order.
export const PUZZLE_TYPES = [
    'numberMatrix',
    'sequenceSolver',
    'deductionGrid',
    'binaryLogic',
    'switchboard',
    'laserPath',
    'measureUp',
    'balanceScale',
    'pixelLogic',
    'numberTrail',
    'letterLock',
];

// Retired from the daily rotation and Free Play, but players have solved these on past days, so they
// still replay from the archive and still count in history, stats and tooltips.
export const RETIRED_PUZZLE_TYPES = ['patternMatch'];

// Every type that can appear in a player's history.
export const HISTORY_PUZZLE_TYPES = [...PUZZLE_TYPES, ...RETIRED_PUZZLE_TYPES];

export const PUZZLE_LABELS = {
    numberMatrix: 'Number Matrix',
    patternMatch: 'Pattern Match',
    sequenceSolver: 'Sequence Solver',
    deductionGrid: 'Deduction Grid',
    binaryLogic: 'Binary Logic',
    switchboard: 'Switchboard',
    laserPath: 'Laser Path',
    measureUp: 'Measure Up',
    balanceScale: 'Balance Scales',
    pixelLogic: 'Pixel Logic',
    numberTrail: 'Number Trail',
    letterLock: 'Letter Lock',
};

export const PUZZLE_ICON_KEYS = {
    numberMatrix: 'hash',
    patternMatch: 'palette',
    sequenceSolver: 'link',
    deductionGrid: 'puzzle',
    binaryLogic: 'zap',
    switchboard: 'power',
    laserPath: 'crosshair',
    measureUp: 'droplets',
    balanceScale: 'scale',
    pixelLogic: 'grid',
    numberTrail: 'route',
    letterLock: 'spell',
};

export const PUZZLE_DESCRIPTIONS = {
    numberMatrix: 'Fill the grid so every row and column has unique numbers',
    patternMatch: 'Find the next pattern in the sequence',
    sequenceSolver: 'Discover the rule and fill in missing numbers',
    deductionGrid: 'Use clues to deduce who owns what',
    binaryLogic: 'Trace the logic gates to find the outputs',
    switchboard: 'Each switch flips itself and its neighbours. Light up the whole board',
    laserPath: 'Turn the mirrors to steer the laser beam into the target',
    measureUp: 'Fill, empty and pour the jugs to measure an exact amount of water',
    balanceScale: 'Every scale is balanced. Work out what each shape weighs',
    pixelLogic: 'Use the row and column clues to fill cells and reveal the hidden picture',
    numberTrail: 'Draw one path through every cell, passing each number in order',
    letterLock: 'Guess the hidden five-letter word. Green is right, yellow is in the wrong spot, grey is not in the word',
};

/** Types that check themselves the moment they're solved (no Submit button). */
export const AUTO_CHECK_TYPES = new Set([
    'switchboard', 'laserPath', 'measureUp', 'balanceScale', 'pixelLogic', 'numberTrail', 'letterLock',
]);

export const PUZZLE_RULES = {
    numberMatrix: {
        rules: [
            'Each row must contain every number exactly once',
            'Each column must contain every number exactly once',
            'Pre-filled cells cannot be changed',
            'At Expert level, box regions also need unique numbers',
        ],
        tips: [
            'Start with rows/columns that have the most given numbers',
            'Look for numbers that can only go in one place',
            'Use elimination: cross off impossible values mentally',
        ],
    },
    patternMatch: {
        rules: [
            'Observe the sequence of shapes, colors, and rotations',
            'Identify the repeating or transforming pattern',
            'Select the shape that continues the pattern',
            'Each round presents a new pattern to solve',
        ],
        tips: [
            'Focus on one attribute at a time (shape, color, rotation)',
            'Count the period — how many items before the pattern repeats',
            'Watch for transformation patterns: gradual rotation or color shifting',
        ],
    },
    sequenceSolver: {
        rules: [
            'A number sequence follows a hidden mathematical rule',
            'Fill in the missing number(s) marked with "?"',
            'The rule applies consistently across the entire sequence',
        ],
        tips: [
            'Check the differences between consecutive numbers first',
            'If differences aren\'t constant, check ratios (multiplication)',
            'Some sequences alternate between two rules',
            'Look for squares, cubes, primes, or Fibonacci-like patterns',
        ],
    },
    deductionGrid: {
        rules: [
            'Each person has exactly one color and one item',
            'No two people share the same color or item',
            'Use the clues to logically determine all assignments',
            'Negative clues tell you what someone does NOT have',
        ],
        tips: [
            'Start with direct clues — they give certain matches',
            'Use negative clues to eliminate possibilities',
            'If only one option remains for a category, it must be the answer',
        ],
    },
    binaryLogic: {
        rules: [
            'Each gate takes binary inputs (0 or 1) and produces an output',
            'AND: output is 1 only if both inputs are 1',
            'OR: output is 1 if at least one input is 1',
            'XOR: output is 1 if inputs are different',
            'NOT: flips the input (0→1, 1→0)',
            'NAND/NOR: the inverse of AND/OR respectively',
        ],
        tips: [
            'Work from known inputs toward unknown outputs',
            'Write down intermediate results as you go',
            'NAND = NOT(AND), NOR = NOT(OR)',
        ],
    },
    switchboard: {
        rules: [
            'Pressing a switch flips it and the switches directly above, below, left and right of it',
            'Light up every switch to win',
            'Pressing the same switch twice cancels out',
            'The "fewest possible" number is the best you can do',
        ],
        tips: [
            'You never need to press any one switch more than once',
            'Work row by row: fix the top row first, then use the row below to correct it',
            'Undo and Reset are free, so experiment',
        ],
    },
    laserPath: {
        rules: [
            'A laser fires into the grid from the emitter (the triangle)',
            'Click a mirror to turn it between leaning right and leaning left',
            'The beam must leave the grid through the target (the ring)',
            'Dark blocks stop the beam',
        ],
        tips: [
            'Follow the beam from the emitter and see where it first goes wrong',
            'Only the mirrors the beam actually touches matter',
            'Work backwards from the target to see which mirror must send the beam there',
        ],
    },
    measureUp: {
        rules: [
            'The jugs have no markings: you can only fill one to the top, empty one completely, or pour',
            'Pouring stops when the jug you pour from is empty or the one you pour into is full',
            'Get exactly the goal amount in any jug',
            'In pour-only puzzles there is no tap: the biggest jug starts full',
        ],
        tips: [
            'After a pour, the difference between the two jugs is often the amount you need',
            'Try pouring both ways: A into B, and B into A',
            'Undo is free, and the "fewest possible" number is your par',
        ],
    },
    balanceScale: {
        rules: [
            'Every scale is perfectly balanced',
            'Grey blocks weigh the number shown',
            'Each kind of shape always weighs the same everywhere',
            'Set a weight for every shape: a scale turns green when it balances',
        ],
        tips: [
            'Start with a scale that only has one kind of shape',
            'Once you know one shape, put its weight into the other scales',
            'Every weight is a whole number from 1 to 12',
        ],
    },
    pixelLogic: {
        rules: [
            'Each number is the length of a run of filled cells in that row or column, in order',
            'Runs are separated by at least one empty cell',
            'Fill cells to satisfy every clue and reveal the picture',
            'A clue turns green when its line matches',
        ],
        tips: [
            'A clue that adds up to the full width (counting gaps) fills the whole line',
            'Use Mark to note cells you know are empty',
            'Every picture can be solved by logic alone, so there is never a need to guess',
        ],
    },
    numberTrail: {
        rules: [
            'Draw one path that visits every cell exactly once',
            'Move up, down, left or right only',
            'The numbers shown must be reached on exactly that step',
            'Start at 1 and finish on the highest number',
        ],
        tips: [
            'Look at two numbers that are close: how many steps apart are they?',
            'Corners and edges have few neighbours, so they force the path',
            'Tap an earlier cell to rewind to it',
        ],
    },
    letterLock: {
        rules: [
            'Guess the hidden five-letter word. Every guess must be a real word',
            'Green: the right letter in the right spot',
            'Yellow: the letter is in the word, but in a different spot',
            'Grey: the letter is not in the word',
        ],
        tips: [
            'Start with a word that uses common letters, like "crane" or "slate"',
            'A letter is only coloured as many times as it appears in the word',
            'Running out of guesses gives you a fresh board for a small penalty',
        ],
    },
};

export const MAX_HINTS = 3;
export const POINTS_BASE = 100;
export const STREAK_BONUS_MULTIPLIER = 0.1;
export const TIMER_PENALTY_PER_MIN = 5;
export const HINT_MULTIPLIER_PENALTY = 0.1; // Each hint reduces multiplier by 0.1x
export const POINTS_MIN = 10;
export const MISTAKE_PENALTY = 10; // each wrong submission (or failed Letter Lock board) costs this many points

/**
 * Calculate final score with hint penalty.
 * Each hint reduces the score multiplier by HINT_MULTIPLIER_PENALTY.
 * Formula: basePoints * max(0.5, 1 - hintsUsed * 0.1) - timePenalty
 */
export function calculateFinalScore(hintsUsed, timerSeconds) {
    const hintMultiplier = Math.max(0.5, 1 - hintsUsed * HINT_MULTIPLIER_PENALTY);
    const timePenalty = Math.floor(timerSeconds / 60) * TIMER_PENALTY_PER_MIN;
    return Math.max(10, Math.round(POINTS_BASE * hintMultiplier - timePenalty));
}

// Seconds before the time penalty starts, for the bigger newer games. The original games have no allowance.
export const TIME_ALLOWANCE = {
    switchboard: 30,
    laserPath: 60,
    measureUp: 60,
    balanceScale: 60,
    pixelLogic: 120,
    numberTrail: 90,
    letterLock: 120,
};

/**
 * Score for a solve: the deployed formula (hint multiplier, then a time penalty), plus a penalty
 * for wrong submissions so guessing doesn't pay. With no mistakes and no time allowance this
 * equals calculateFinalScore().
 */
export function computePoints({ hintsUsed = 0, mistakes = 0, timeSeconds = 0, puzzleType } = {}) {
    const hintMultiplier = Math.max(0.5, 1 - hintsUsed * HINT_MULTIPLIER_PENALTY);
    const timed = Math.max(0, timeSeconds - (TIME_ALLOWANCE[puzzleType] || 0));
    const timePenalty = Math.floor(timed / 60) * TIMER_PENALTY_PER_MIN;
    return Math.max(POINTS_MIN, Math.round(POINTS_BASE * hintMultiplier - timePenalty - mistakes * MISTAKE_PENALTY));
}

/**
 * Hint allowance per difficulty level.
 * Novice gets more hints, Expert gets fewer.
 */
export const HINT_ALLOWANCE = {
    novice: 3,
    intermediate: 2,
    expert: 1,
};

export const DIFFICULTY_LEVELS = [
    { key: 'novice', label: 'Novice', modifier: 0.6, description: 'Gentle intro • 3 hints available' },
    { key: 'intermediate', label: 'Intermediate', modifier: 1.0, description: 'Balanced challenge • 2 hints' },
    { key: 'expert', label: 'Expert', modifier: 1.8, description: 'Maximum complexity • 1 hint only' },
];

export const ACHIEVEMENTS = [
    { id: 'first_solve', name: 'First Steps', desc: 'Solve your first puzzle', icon: 'target' },
    { id: 'streak_3', name: 'On a Roll', desc: '3-day streak', icon: 'flame' },
    { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: 'swords' },
    { id: 'streak_30', name: 'Monthly Master', desc: '30-day streak', icon: 'crown' },
    { id: 'no_hints', name: 'No Help Needed', desc: 'Solve without hints', icon: 'circuitBoard' },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Solve in under 60 seconds', icon: 'zap' },
    { id: 'all_types', name: 'Well Rounded', desc: 'Solve every puzzle type', icon: 'star' },
    { id: 'perfect_10', name: 'Perfect Ten', desc: '10 puzzles with no mistakes', icon: 'gem' },
    { id: 'night_owl', name: 'Night Owl', desc: 'Solve after midnight', icon: 'moon' },
    { id: 'early_bird', name: 'Early Bird', desc: 'Solve before 7 AM', icon: 'bird' },
];
