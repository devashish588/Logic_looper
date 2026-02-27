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

// Icon keys — rendered via PuzzleIcon component from Icons.jsx
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

export const MAX_HINTS = 3;
export const POINTS_BASE = 100;
export const STREAK_BONUS_MULTIPLIER = 0.1;
export const TIMER_PENALTY_PER_MIN = 5;

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
    desc: 'Solve all 5 puzzle types',
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
];
