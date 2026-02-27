import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Pattern Match — visual pattern sequences.
 * Player picks the next element from 4 options based on a repeating rule.
 */

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];
const ROTATIONS = [0, 90, 180, 270];

function generatePattern(rng, length) {
  // Create a repeating pattern with period 2-4
  const period = randInt(2, 4, rng);
  const base = [];
  for (let i = 0; i < period; i++) {
    base.push({
      shape: SHAPES[randInt(0, SHAPES.length - 1, rng)],
      color: COLORS[randInt(0, COLORS.length - 1, rng)],
      rotation: ROTATIONS[randInt(0, ROTATIONS.length - 1, rng)],
    });
  }
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push({ ...base[i % period] });
  }
  return { sequence, period, base };
}

export function generate(rng, difficulty = 1) {
  const numRounds = Math.min(3 + Math.floor(difficulty), 6);
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const seqLength = randInt(4, 6, rng);
    const { sequence, period, base } = generatePattern(rng, seqLength);

    // The answer is the next element in the sequence
    const answer = { ...base[seqLength % period] };

    // Generate 3 wrong options
    const options = [answer];
    while (options.length < 4) {
      const fake = {
        shape: SHAPES[randInt(0, SHAPES.length - 1, rng)],
        color: COLORS[randInt(0, COLORS.length - 1, rng)],
        rotation: ROTATIONS[randInt(0, ROTATIONS.length - 1, rng)],
      };
      // Ensure it's different from the answer
      if (
        fake.shape !== answer.shape ||
        fake.color !== answer.color ||
        fake.rotation !== answer.rotation
      ) {
        options.push(fake);
      }
    }
    shuffle(options, rng);

    rounds.push({
      sequence: sequence,
      options,
      answerIndex: options.findIndex(
        (o) =>
          o.shape === answer.shape &&
          o.color === answer.color &&
          o.rotation === answer.rotation,
      ),
    });
  }

  return {
    type: 'patternMatch',
    rounds,
    totalRounds: numRounds,
  };
}

export function validate(userAnswers, puzzleData) {
  return puzzleData.rounds.every(
    (round, i) => userAnswers[i] === round.answerIndex,
  );
}

export function getHint(puzzleData, currentRound) {
  if (currentRound >= puzzleData.rounds.length) return null;
  const round = puzzleData.rounds[currentRound];
  // Eliminate one wrong answer
  const wrongIndices = round.options
    .map((_, i) => i)
    .filter((i) => i !== round.answerIndex);
  return { eliminateIndex: wrongIndices[0] };
}
