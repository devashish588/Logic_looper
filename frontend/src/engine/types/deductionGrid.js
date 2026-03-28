import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Deduction Grid — Einstein-puzzle style logic puzzle.
 * 3 categories × 3 items, use clues to match them up.
 */

const CATEGORIES = {
    names: [
        ['Alice', 'Bob', 'Carol'],
        ['Dave', 'Eve', 'Frank'],
        ['Grace', 'Hank', 'Ivy'],
    ],
    colors: [
        ['Red', 'Blue', 'Green'],
        ['Purple', 'Orange', 'Yellow'],
        ['Teal', 'Pink', 'Gold'],
    ],
    items: [
        ['Cat', 'Dog', 'Fish'],
        ['Book', 'Phone', 'Watch'],
        ['Coffee', 'Tea', 'Juice'],
    ],
};

function generateClues(solution, rng) {
    const clues = [];
    const [names, colors, items] = solution;

    // Direct association clues
    const idx1 = randInt(0, 2, rng);
    clues.push({
        type: 'direct',
        text: `${names[idx1]} has a ${colors[idx1]} house.`,
        data: { category1: 'names', value1: names[idx1], category2: 'colors', value2: colors[idx1] },
    });

    const idx2 = (idx1 + 1) % 3;
    clues.push({
        type: 'direct',
        text: `${names[idx2]} owns a ${items[idx2]}.`,
        data: { category1: 'names', value1: names[idx2], category2: 'items', value2: items[idx2] },
    });

    // Negative clue
    const idx3 = (idx2 + 1) % 3;
    const wrongItem = items[(idx3 + 1) % 3];
    clues.push({
        type: 'negative',
        text: `${names[idx3]} does NOT own a ${wrongItem}.`,
        data: { category1: 'names', value1: names[idx3], category2: 'items', value2: wrongItem },
    });

    // Association between colors and items
    clues.push({
        type: 'direct',
        text: `The ${colors[idx3]} house has a ${items[idx3]}.`,
        data: { category1: 'colors', value1: colors[idx3], category2: 'items', value2: items[idx3] },
    });

    // Extra clue for solvability
    const remaining = [0, 1, 2].filter(i => i !== idx1 && i !== idx2)[0];
    clues.push({
        type: 'direct',
        text: `${names[remaining]} has a ${colors[remaining]} house.`,
        data: { category1: 'names', value1: names[remaining], category2: 'colors', value2: colors[remaining] },
    });

    shuffle(clues, rng);
    return clues;
}

export function generate(rng, difficulty = 1) {
    const setIdx = randInt(0, 2, rng);
    const names = [...CATEGORIES.names[setIdx]];
    const colors = [...CATEGORIES.colors[setIdx]];
    const items = [...CATEGORIES.items[setIdx]];

    shuffle(names, rng);
    shuffle(colors, rng);
    shuffle(items, rng);

    const solution = [names, colors, items];
    const clues = generateClues(solution, rng);

    return {
        type: 'deductionGrid',
        categories: {
            names: [...names].sort(),
            colors: [...colors].sort(),
            items: [...items].sort(),
        },
        clues,
        solution: {
            // Map: name -> { color, item }
            assignments: names.reduce((acc, name, i) => {
                acc[name] = { color: colors[i], item: items[i] };
                return acc;
            }, {}),
        },
        size: 3,
    };
}

export function validate(userAssignments, solution) {
    const correct = solution.assignments;
    for (const name of Object.keys(correct)) {
        if (
            !userAssignments[name] ||
            userAssignments[name].color !== correct[name].color ||
            userAssignments[name].item !== correct[name].item
        ) {
            return false;
        }
    }
    return true;
}

export function getHint(puzzleData) {
    // Reveal one assignment
    const names = Object.keys(puzzleData.solution.assignments);
    const randomName = names[Math.floor(Math.random() * names.length)];
    return {
        name: randomName,
        ...puzzleData.solution.assignments[randomName],
    };
}
