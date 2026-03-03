import { shuffle, randInt, pickN } from '../../utils/seededRng.js';

/**
 * Truth & Lies (Knights & Knaves).
 * Characters are either Knights (always tell truth) or Knaves (always lie).
 * Each makes a statement about themselves or others.
 * Player must identify who is a Knight and who is a Knave.
 */

const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];

/**
 * Generate a statement that character `speaker` makes about `target`.
 * If speaker is a knight, statement is true. If knave, statement is false.
 */
function makeStatement(speaker, target, roles, rng) {
    const targetIsKnight = roles[target] === 'knight';
    const speakerIsKnight = roles[speaker] === 'knight';

    // The actual claim: "X is a knight" or "X is a knave"
    const claimKnight = rng() > 0.5;

    // For a knight: they tell the truth, so claim matches reality
    // For a knave: they lie, so claim is inverted
    let claimText;
    if (speakerIsKnight) {
        // Truth: assert what target actually is
        claimText = targetIsKnight
            ? `${target} is a Knight`
            : `${target} is a Knave`;
    } else {
        // Lie: assert the opposite
        claimText = targetIsKnight
            ? `${target} is a Knave`
            : `${target} is a Knight`;
    }

    return {
        speaker,
        target,
        text: claimText,
    };
}

export function generate(rng, difficulty = 1) {
    // Difficulty scales character count: 3 (easy), 4 (medium), 5-6 (hard)
    const charCount = Math.min(6, Math.max(3, Math.floor(2 + difficulty)));
    const selectedNames = pickN(NAMES, charCount, rng);

    // Assign roles randomly
    const roles = {};
    for (const name of selectedNames) {
        roles[name] = rng() > 0.5 ? 'knight' : 'knave';
    }

    // Ensure at least one knight and one knave
    const roleValues = Object.values(roles);
    if (roleValues.every((r) => r === 'knight')) {
        roles[selectedNames[0]] = 'knave';
    } else if (roleValues.every((r) => r === 'knave')) {
        roles[selectedNames[0]] = 'knight';
    }

    // Each character makes a statement about someone else
    const statements = [];
    for (const speaker of selectedNames) {
        const others = selectedNames.filter((n) => n !== speaker);
        const target = others[randInt(0, others.length - 1, rng)];
        statements.push(makeStatement(speaker, target, roles, rng));
    }

    // Solution: map of name → 'knight' | 'knave'
    const solution = { ...roles };

    return {
        type: 'truthAndLies',
        characters: selectedNames,
        statements,
        solution,
        description:
            'Knights always tell the truth. Knaves always lie. Identify each character.',
    };
}

export function validate(userAnswers, puzzleData) {
    const { solution } = puzzleData;
    for (const name of Object.keys(solution)) {
        if (
            !userAnswers[name] ||
            userAnswers[name].toLowerCase() !== solution[name]
        ) {
            return false;
        }
    }
    return true;
}

export function getHint(puzzleData) {
    const { characters, solution } = puzzleData;
    // Reveal one character's role
    const idx = Math.floor(Math.random() * characters.length);
    const name = characters[idx];
    return { name, role: solution[name] };
}
