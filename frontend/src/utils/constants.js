export const PUZZLE_TYPES = [
  'numberMatrix',
  'patternMatch',
  'sequenceSolver',
  'deductionGrid',
  'binaryLogic',
  'truthAndLies',
  'binaryBridge',
  'quantumGrid',
];

export const PUZZLE_LABELS = {
  numberMatrix: 'Number Matrix',
  patternMatch: 'Pattern Match',
  sequenceSolver: 'Sequence Solver',
  deductionGrid: 'Deduction Grid',
  binaryLogic: 'Binary Logic',
  truthAndLies: 'Truth & Lies',
  binaryBridge: 'Binary Bridge',
  quantumGrid: 'Quantum Grid',
};

// Icon keys — rendered via PuzzleIcon component from Icons.jsx
export const PUZZLE_ICON_KEYS = {
  numberMatrix: 'hash',
  patternMatch: 'palette',
  sequenceSolver: 'link',
  deductionGrid: 'puzzle',
  binaryLogic: 'zap',
  truthAndLies: 'scale',
  binaryBridge: 'route',
  quantumGrid: 'atom',
};

export const PUZZLE_DESCRIPTIONS = {
  numberMatrix: 'Fill the grid so every row and column has unique numbers',
  patternMatch: 'Find the next pattern in the sequence',
  sequenceSolver: 'Discover the rule and fill in missing numbers',
  deductionGrid: 'Use clues to deduce who owns what',
  binaryLogic: 'Trace the logic gates to find the outputs',
  truthAndLies: 'Identify who tells the truth and who lies',
  binaryBridge: 'Find the path connecting nodes by numeric rules',
  quantumGrid: 'Place symbols so every row and column is unique',
};

export const PUZZLE_HOW_TO_PLAY = {
  numberMatrix: {
    rules: [
      'Each cell must contain a number from 1 to N (N = grid size)',
      'Every row must have each number exactly once',
      'Every column must have each number exactly once',
      'Pre-filled cells (highlighted) cannot be changed',
    ],
    tip: 'Start with rows or columns that have the most filled cells — fewer possibilities to check.',
  },
  patternMatch: {
    rules: [
      'A sequence of shapes/patterns is shown with a missing piece',
      'Study the color, shape, rotation, and size changes',
      'Select the option that logically continues the pattern',
      'Each round presents a new pattern to solve',
    ],
    tip: 'Look for two properties changing at once — color + shape, or size + rotation.',
  },
  sequenceSolver: {
    rules: [
      'A number sequence is shown with one or more blanks',
      'Figure out the mathematical rule connecting the numbers',
      'Fill in the missing numbers that follow the rule',
      'Rules can involve addition, multiplication, squares, or combos',
    ],
    tip: 'Calculate the differences between consecutive numbers — constant diff means linear, growing diff means quadratic.',
  },
  deductionGrid: {
    rules: [
      'Several people each own a unique item',
      'Read the clues carefully to eliminate impossible pairings',
      'Assign exactly one item to each person using the dropdowns',
      'Every item must be assigned and no two people share an item',
    ],
    tip: 'Start with "direct" clues (e.g., "Alice owns the cat") before tackling elimination clues.',
  },
  binaryLogic: {
    rules: [
      'A circuit of logic gates (AND, OR, XOR, NOT) is shown',
      'Input values (0 or 1) are given at the top',
      'Trace through each gate to compute the unknown outputs',
      'AND = both 1 → 1 | OR = any 1 → 1 | XOR = different → 1 | NOT = flip',
    ],
    tip: 'Work layer by layer, left to right. Compute each gate\'s output before moving deeper.',
  },
  truthAndLies: {
    rules: [
      'Each character is either a Knight (always tells truth) or a Knave (always lies)',
      'Each character makes a statement about someone else',
      'Use logic to figure out who is a Knight and who is a Knave',
      'Tap a character to toggle between Knight 🛡️ and Knave 🎭',
    ],
    tip: 'Start by assuming one character is a Knight, then check if their statement is consistent. If not, they must be a Knave.',
  },
  binaryBridge: {
    rules: [
      'Build a path from the green start cell (top-left) to the red end cell (bottom-right)',
      'You can only move to adjacent cells (up, down, left, right — no diagonals)',
      'The values of consecutive cells must differ by at most the shown limit',
      'Click a cell to add it to your path, click the last cell to undo',
    ],
    tip: 'Plan ahead — don\'t just follow the nearest valid cell. Sometimes a longer route is the only valid one.',
  },
  quantumGrid: {
    rules: [
      'Select a symbol from the palette at the top',
      'Tap an empty cell to place the selected symbol',
      'Every row must contain each symbol exactly once',
      'Every column must contain each symbol exactly once',
    ],
    tip: 'Look for rows or columns missing only one symbol — those are free wins!',
  },
};

// ── Difficulty System ──────────────────────────────────────────
export const DIFFICULTY_LEVELS = {
  NOVICE: {
    key: 'NOVICE',
    label: 'Novice',
    dbKey: 'EASY',
    hints: 3,
    modifier: 1,
    multiplier: 1.0,
    color: '#414BEA',
    gridSize: 3,
  },
  ADEPT: {
    key: 'ADEPT',
    label: 'Adept',
    dbKey: 'MEDIUM',
    hints: 1,
    modifier: 2,
    multiplier: 1.5,
    color: '#525CEB',
    gridSize: 5,
  },
  GRANDMASTER: {
    key: 'GRANDMASTER',
    label: 'Grandmaster',
    dbKey: 'HARD',
    hints: 0,
    modifier: 3,
    multiplier: 2.5,
    color: '#F05537',
    gridSize: 7,
  },
};

export const STREAK_DIFFICULTY_THRESHOLDS = {
  NOVICE: 0,
  ADEPT: 5,
  GRANDMASTER: 20,
};

export function getDifficultyForStreak(streak) {
  if (streak >= STREAK_DIFFICULTY_THRESHOLDS.GRANDMASTER) return DIFFICULTY_LEVELS.GRANDMASTER;
  if (streak >= STREAK_DIFFICULTY_THRESHOLDS.ADEPT) return DIFFICULTY_LEVELS.ADEPT;
  return DIFFICULTY_LEVELS.NOVICE;
}

export const MAX_HINTS = 3;
export const POINTS_BASE = 100;
export const STREAK_BONUS_MULTIPLIER = 0.1;
export const TIMER_PENALTY_PER_MIN = 5;
export const GRANDMASTER_TIME_PENALTY_PER_30S = 10;

export const ACHIEVEMENTS = [
  {
    id: 'first_solve',
    name: 'First Steps',
    desc: 'Solve your first puzzle',
    icon: 'target',
  },
  { id: 'streak_3', name: 'On a Roll', desc: '3-day streak', icon: 'flame' },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    desc: '7-day streak',
    icon: 'swords',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    desc: '30-day streak',
    icon: 'crown',
  },
  {
    id: 'no_hints',
    name: 'No Help Needed',
    desc: 'Solve without hints',
    icon: 'circuitBoard',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    desc: 'Solve in under 60 seconds',
    icon: 'zap',
  },
  {
    id: 'all_types',
    name: 'Well Rounded',
    desc: 'Solve all 8 puzzle types',
    icon: 'star',
  },
  {
    id: 'perfect_10',
    name: 'Perfect Ten',
    desc: '10 puzzles with no mistakes',
    icon: 'gem',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    desc: 'Solve after midnight',
    icon: 'moon',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    desc: 'Solve before 7 AM',
    icon: 'bird',
  },
  {
    id: 'grandmaster_win',
    name: 'Grand Master',
    desc: 'Complete a Grandmaster puzzle',
    icon: 'crown',
  },
];
