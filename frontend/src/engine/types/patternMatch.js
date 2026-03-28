import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Pattern Match — visual pattern sequences.
 * Enhanced with transformation patterns (progressive rotation, color shifting).
 * Distractors share 1-2 attributes with the answer for added challenge.
 */

const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
const ROTATIONS = [0, 90, 180, 270];

function generatePattern(rng, length, useTransformations) {
    if (useTransformations && rng() > 0.4) {
        return generateTransformPattern(rng, length);
    }
    return generateRepeatingPattern(rng, length);
}

function generateRepeatingPattern(rng, length) {
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
    const answer = { ...base[length % period] };
    return { sequence, answer };
}

function generateTransformPattern(rng, length) {
    // Transformation: one attribute changes progressively, others stay or cycle
    const baseShape = SHAPES[randInt(0, SHAPES.length - 1, rng)];
    const baseColor = COLORS[randInt(0, COLORS.length - 1, rng)];
    const transformType = randInt(0, 2, rng); // 0=rotation, 1=color-cycle, 2=shape-cycle

    const sequence = [];
    for (let i = 0; i < length; i++) {
        let shape = baseShape;
        let color = baseColor;
        let rotation = 0;

        if (transformType === 0) {
            // Progressive rotation
            rotation = (i * 90) % 360;
            shape = SHAPES[randInt(0, 1, rng) === 0 ? SHAPES.indexOf(baseShape) : SHAPES.indexOf(baseShape)];
        } else if (transformType === 1) {
            // Color cycles through a subset
            const colorSubset = COLORS.slice(0, 3);
            color = colorSubset[i % colorSubset.length];
            rotation = ROTATIONS[randInt(0, ROTATIONS.length - 1, rng)];
        } else {
            // Shape cycles
            const shapeSubset = SHAPES.slice(0, 3);
            shape = shapeSubset[i % shapeSubset.length];
        }

        sequence.push({ shape, color, rotation });
    }

    // Answer follows the same transformation
    const i = length;
    let answer = { shape: baseShape, color: baseColor, rotation: 0 };
    if (transformType === 0) {
        answer.rotation = (i * 90) % 360;
    } else if (transformType === 1) {
        const colorSubset = COLORS.slice(0, 3);
        answer.color = colorSubset[i % colorSubset.length];
    } else {
        const shapeSubset = SHAPES.slice(0, 3);
        answer.shape = shapeSubset[i % shapeSubset.length];
    }

    return { sequence, answer };
}

function generateSmartDistractor(answer, rng) {
    // Share 1-2 attributes with the answer to make it harder
    const distractor = { ...answer };
    const attrs = ['shape', 'color', 'rotation'];
    const changeCount = randInt(1, 2, rng);
    const toChange = shuffle([...attrs], rng).slice(0, changeCount);

    for (const attr of toChange) {
        if (attr === 'shape') {
            let newShape;
            do { newShape = SHAPES[randInt(0, SHAPES.length - 1, rng)]; } while (newShape === answer.shape);
            distractor.shape = newShape;
        } else if (attr === 'color') {
            let newColor;
            do { newColor = COLORS[randInt(0, COLORS.length - 1, rng)]; } while (newColor === answer.color);
            distractor.color = newColor;
        } else {
            let newRot;
            do { newRot = ROTATIONS[randInt(0, ROTATIONS.length - 1, rng)]; } while (newRot === answer.rotation);
            distractor.rotation = newRot;
        }
    }

    return distractor;
}

export function generate(rng, difficulty = 1) {
    const numRounds = Math.min(3 + Math.floor(difficulty), 6);
    const useTransformations = difficulty >= 1.0;
    const rounds = [];

    for (let r = 0; r < numRounds; r++) {
        const seqLength = randInt(4, 6, rng);
        const { sequence, answer } = generatePattern(rng, seqLength, useTransformations);

        // Generate smart distractors
        const options = [answer];
        const seen = new Set();
        seen.add(`${answer.shape}-${answer.color}-${answer.rotation}`);

        while (options.length < 4) {
            const fake = generateSmartDistractor(answer, rng);
            const key = `${fake.shape}-${fake.color}-${fake.rotation}`;
            if (!seen.has(key)) {
                options.push(fake);
                seen.add(key);
            }
        }
        shuffle(options, rng);

        rounds.push({
            sequence,
            options,
            answerIndex: options.findIndex(
                o => o.shape === answer.shape && o.color === answer.color && o.rotation === answer.rotation
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
    return puzzleData.rounds.every((round, i) => userAnswers[i] === round.answerIndex);
}

export function getHint(puzzleData, currentRound) {
    if (currentRound >= puzzleData.rounds.length) return null;
    const round = puzzleData.rounds[currentRound];
    const wrongIndices = round.options
        .map((_, i) => i)
        .filter(i => i !== round.answerIndex);
    return { eliminateIndex: wrongIndices[0] };
}
