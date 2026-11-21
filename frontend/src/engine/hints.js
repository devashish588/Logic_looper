import * as switchboard from './types/switchboard.js';
import * as laserPath from './types/laserPath.js';
import * as measureUp from './types/measureUp.js';
import * as balanceScale from './types/balanceScale.js';
import * as pixelLogic from './types/pixelLogic.js';
import * as numberTrail from './types/numberTrail.js';
import * as letterLock from './types/letterLock.js';

const at = (r, c) => `row ${r + 1}, column ${c + 1}`;

/**
 * Turn a hint request into something the player can actually see.
 *
 * Before v1.1 the Hint button cost 20 points but displayed nothing: the
 * engines' getHint() functions were never called. Hints here are
 * deterministic (the Nth hint is always the same for a given puzzle), so a
 * page refresh can't be used to fish for different hints.
 *
 * @param {object} puzzle      the generated puzzle
 * @param {number} hintIndex   0-based index of the hint being requested
 * @param {object} ctx         { userAnswer }
 * @returns {{ text: string, highlight?: object, free?: boolean } | null}
 *          `free` hints carry no new information and should not cost a hint.
 */
export function buildHint(puzzle, hintIndex, { userAnswer } = {}) {
    switch (puzzle?.type) {
        case 'numberMatrix': {
            const grid = Array.isArray(userAnswer) ? userAnswer : puzzle.puzzle;
            const wrong = [];
            for (let r = 0; r < puzzle.size; r++) {
                for (let c = 0; c < puzzle.size; c++) {
                    if (!puzzle.given[r][c] && grid[r]?.[c] !== puzzle.solution[r][c]) {
                        wrong.push({ r, c, value: puzzle.solution[r][c] });
                    }
                }
            }
            if (!wrong.length) return { text: 'Every cell is already correct. Submit your solution!' };
            const cell = wrong[hintIndex % wrong.length];
            return { text: `Row ${cell.r + 1}, column ${cell.c + 1} should be ${cell.value}.` };
        }

        case 'sequenceSolver': {
            const round = puzzle.rounds[hintIndex % puzzle.rounds.length];
            const ri = hintIndex % puzzle.rounds.length;
            const descriptions = {
                arithmetic: `each term adds the same amount (${round.ruleLabel})`,
                geometric: `each term is multiplied by the same amount (${round.ruleLabel})`,
                square: 'the terms are consecutive perfect squares',
                triangular: 'the terms are a multiple of the triangular numbers (1, 3, 6, 10, …)',
                'fibonacci-like': 'each term is the sum of the two before it',
                'alternating-add': `the step alternates between two values (${round.ruleLabel})`,
                primes: 'the terms are consecutive prime numbers',
                'double-plus': `each term is double the previous one, plus a constant (${round.ruleLabel})`,
                descending: `each term subtracts the same amount (${round.ruleLabel})`,
                interleaved: 'two separate sequences take turns: look at every other term',
                'growing-step': `the gap grows by one each time (${round.ruleLabel})`,
            };
            return { text: `Sequence ${ri + 1}: ${descriptions[round.ruleName] || round.ruleLabel}.` };
        }

        case 'deductionGrid': {
            const names = Object.keys(puzzle.solution.assignments).sort();
            const name = names[hintIndex % names.length];
            const { color, item } = puzzle.solution.assignments[name];
            return { text: `${name} has the ${color} house and owns the ${item}.` };
        }

        case 'binaryLogic': {
            const q = puzzle.questions[hintIndex % puzzle.questions.length];
            const gate = puzzle.gates.flat().find(g => g.id === q.gateId);
            const labels = gate.inputs.map(id => {
                const inp = puzzle.inputs.find(i => i.id === id);
                return inp ? inp.label : id.replace('gate_', 'G');
            });
            return { text: `The ${gate.type} gate fed by ${labels.join(' and ')} outputs ${q.answer}.` };
        }

        case 'switchboard': {
            const h = switchboard.getHint(puzzle, userAnswer);
            if (!h) return null;
            const r = Math.floor(h.cell / puzzle.size), c = h.cell % puzzle.size;
            return {
                text: `Press the switch in ${at(r, c)}. You're ${h.remaining} press${h.remaining === 1 ? '' : 'es'} from solved.`,
                highlight: { cells: [h.cell] },
            };
        }

        case 'laserPath': {
            const h = laserPath.getHint(puzzle, userAnswer);
            if (!h) return null;
            const lean = h.orientation === '/' ? 'right ( / )' : 'left ( \\ )';
            return {
                text: `Turn the mirror in ${at(h.r, h.c)} so it leans ${lean}.`,
                highlight: { cells: [h.r * puzzle.size + h.c] },
            };
        }

        case 'measureUp': {
            const h = measureUp.getHint(puzzle, userAnswer);
            if (!h) return null;
            const jug = h.move.a === 'pour' ? h.move.from : h.move.i;
            return {
                text: `${measureUp.describeMove(h.move)}. Then you're ${h.remaining - 1} move${h.remaining - 1 === 1 ? '' : 's'} from the goal.`,
                highlight: { jugs: [jug] },
            };
        }

        case 'balanceScale': {
            const h = balanceScale.getHint(puzzle, userAnswer);
            if (!h) return null;
            return { text: `The ${h.name} weighs ${h.weight}.`, highlight: { shapes: [h.shape] } };
        }

        case 'pixelLogic': {
            const h = pixelLogic.getHint(puzzle, userAnswer);
            if (!h) return null;
            return {
                text: h.filled ? `The cell in ${at(h.r, h.c)} is filled.` : `The cell in ${at(h.r, h.c)} should be empty.`,
                highlight: { cells: [h.r * puzzle.size + h.c] },
            };
        }

        case 'numberTrail': {
            const h = numberTrail.getHint(puzzle, userAnswer);
            if (!h) return null;
            return {
                text: h.diverged
                    ? `Your trail goes wrong at step ${h.number}: that step belongs in ${at(h.r, h.c)}.`
                    : `Step ${h.number} goes in ${at(h.r, h.c)}.`,
                highlight: { cells: [h.cell] },
            };
        }

        case 'letterLock': {
            const h = letterLock.getHint(puzzle, userAnswer, hintIndex);
            if (!h) return null;
            return { text: `Letter ${h.position + 1} is "${h.letter}".` };
        }

        default:
            return null;
    }
}

/** True when the player has entered something worth checking. */
export function hasAnyAnswer(puzzle, userAnswer) {
    if (puzzle?.autoCheck) return userAnswer != null;
    if (userAnswer == null) return false;
    if (Array.isArray(userAnswer)) return userAnswer.some(row => row.some(v => v));
    return Object.values(userAnswer).some(v => v !== '' && v != null);
}


/**
 * Hints for the original games reveal a value right on the board (the renderers highlight it with the
 * brand orange): find the first wrong or empty spot and return what belongs there. Returns null when
 * there is nothing left to reveal. Used as deployed, so these games look and feel the same.
 *
 * @param {object} puzzle
 * @param {{ userAnswer?: any, currentRound?: number, hintsUsed?: number }} ctx
 */
export function computeRevealHint(puzzle, { userAnswer, currentRound = 0, hintsUsed = 0 } = {}) {
    switch (puzzle?.type) {
        case 'numberMatrix': {
            const userGrid = userAnswer || puzzle.puzzle;
            for (let r = 0; r < puzzle.size; r++) {
                for (let c = 0; c < puzzle.size; c++) {
                    if (!puzzle.given[r][c]) {
                        const userVal = userGrid?.[r]?.[c] || 0;
                        if (userVal !== puzzle.solution[r][c]) {
                            return { type: 'cell', row: r, col: c, value: puzzle.solution[r][c] };
                        }
                    }
                }
            }
            return null;
        }
        case 'sequenceSolver': {
            for (let ri = 0; ri < puzzle.rounds.length; ri++) {
                const round = puzzle.rounds[ri];
                for (let bi = 0; bi < round.blanks.length; bi++) {
                    const key = `${ri}-${bi}`;
                    const userVal = userAnswer?.[key];
                    const correctVal = round.sequence[round.blanks[bi]];
                    if (!userVal || parseInt(userVal) !== correctVal) {
                        return { type: 'sequence', key, value: correctVal };
                    }
                }
            }
            return null;
        }
        case 'binaryLogic': {
            for (const q of puzzle.questions) {
                const userVal = userAnswer?.[q.gateId];
                if (userVal === undefined || userVal === '' || parseInt(userVal) !== q.answer) {
                    return { type: 'gate', gateId: q.gateId, value: q.answer };
                }
            }
            return null;
        }
        case 'deductionGrid': {
            const solution = puzzle.solution.assignments;
            for (const name of Object.keys(solution)) {
                const userAssign = userAnswer?.[name];
                if (!userAssign || userAssign.color !== solution[name].color || userAssign.item !== solution[name].item) {
                    return { type: 'assignment', name, ...solution[name] };
                }
            }
            return null;
        }
        case 'patternMatch': {
            const round = puzzle.rounds[currentRound];
            if (!round) return null;
            const wrongIndices = round.options.map((_, i) => i).filter(i => i !== round.answerIndex);
            if (!wrongIndices.length) return null;
            return { type: 'eliminate', eliminateIndex: wrongIndices[hintsUsed % wrongIndices.length], round: currentRound };
        }
        default:
            return null;
    }
}

/** The original games, whose hints reveal a value on the board (see computeRevealHint). */
export const REVEAL_HINT_TYPES = new Set(['numberMatrix', 'patternMatch', 'sequenceSolver', 'deductionGrid', 'binaryLogic']);
