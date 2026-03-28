export const PUZZLE_TYPES = [
    'numberMatrix',
    'patternMatch',
    'sequenceSolver',
    'deductionGrid',
    'binaryLogic',
];

export const PUZZLE_LABELS = {
    numberMatrix: 'Number Matrix',
    patternMatch: 'Pattern Match',
    sequenceSolver: 'Sequence Solver',
    deductionGrid: 'Deduction Grid',
    binaryLogic: 'Binary Logic',
};

export const PUZZLE_ICON_KEYS = {
    numberMatrix: 'hash',
    patternMatch: 'palette',
    sequenceSolver: 'link',
    deductionGrid: 'puzzle',
    binaryLogic: 'zap',
};

export const PUZZLE_DESCRIPTIONS = {
    numberMatrix: 'Fill the grid so every row and column has unique numbers',
    patternMatch: 'Find the next pattern in the sequence',
    sequenceSolver: 'Discover the rule and fill in missing numbers',
    deductionGrid: 'Use clues to deduce who owns what',
    binaryLogic: 'Trace the logic gates to find the outputs',
};

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
};

export const MAX_HINTS = 3;
export const POINTS_BASE = 100;
export const STREAK_BONUS_MULTIPLIER = 0.1;
export const TIMER_PENALTY_PER_MIN = 5;
export const HINT_MULTIPLIER_PENALTY = 0.1; // Each hint reduces multiplier by 0.1x

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
    { id: 'all_types', name: 'Well Rounded', desc: 'Solve all 5 puzzle types', icon: 'star' },
    { id: 'perfect_10', name: 'Perfect Ten', desc: '10 puzzles with no mistakes', icon: 'gem' },
    { id: 'night_owl', name: 'Night Owl', desc: 'Solve after midnight', icon: 'moon' },
    { id: 'early_bird', name: 'Early Bird', desc: 'Solve before 7 AM', icon: 'bird' },
];
