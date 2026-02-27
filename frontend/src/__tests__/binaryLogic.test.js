import { createRng } from '../utils/seededRng.js';
import { generate, validate, getHint } from '../engine/types/binaryLogic.js';

describe('binaryLogic', () => {
    let rng;

    beforeEach(() => {
        rng = createRng('test-binary-logic');
    });

    describe('generate', () => {
        it('returns an object with type, inputs, gates, questions, and solution', () => {
            const result = generate(rng);
            expect(result.type).toBe('binaryLogic');
            expect(Array.isArray(result.inputs)).toBe(true);
            expect(Array.isArray(result.gates)).toBe(true);
            expect(Array.isArray(result.questions)).toBe(true);
            expect(typeof result.solution).toBe('object');
        });

        it('inputs have id, value (0 or 1), and label', () => {
            const result = generate(rng);
            for (const inp of result.inputs) {
                expect(inp).toHaveProperty('id');
                expect(inp).toHaveProperty('value');
                expect(inp).toHaveProperty('label');
                expect([0, 1]).toContain(inp.value);
            }
        });

        it('gates are organized in layers', () => {
            const result = generate(rng);
            for (const layer of result.gates) {
                expect(Array.isArray(layer)).toBe(true);
                for (const gate of layer) {
                    expect(gate).toHaveProperty('id');
                    expect(gate).toHaveProperty('type');
                    expect(gate).toHaveProperty('inputs');
                    expect(['AND', 'OR', 'XOR', 'NOT']).toContain(gate.type);
                }
            }
        });

        it('questions have gateId and answer (0 or 1)', () => {
            const result = generate(rng);
            for (const q of result.questions) {
                expect(q).toHaveProperty('gateId');
                expect(q).toHaveProperty('answer');
                expect([0, 1]).toContain(q.answer);
            }
        });

        it('solution maps gateId to answer', () => {
            const result = generate(rng);
            for (const q of result.questions) {
                expect(result.solution[q.gateId]).toBe(q.answer);
            }
        });

        it('is deterministic', () => {
            const r1 = generate(createRng('det-bin'));
            const r2 = generate(createRng('det-bin'));
            expect(r1.solution).toEqual(r2.solution);
            expect(r1.inputs.map((i) => i.value)).toEqual(
                r2.inputs.map((i) => i.value),
            );
        });
    });

    describe('validate', () => {
        it('returns true for correct answers', () => {
            const puzzle = generate(rng);
            expect(validate(puzzle.solution, puzzle)).toBe(true);
        });

        it('returns false for incorrect answers', () => {
            const puzzle = generate(rng);
            const wrong = {};
            for (const key of Object.keys(puzzle.solution)) {
                wrong[key] = puzzle.solution[key] === 0 ? 1 : 0;
            }
            expect(validate(wrong, puzzle)).toBe(false);
        });
    });

    describe('getHint', () => {
        it('returns gateId and answer', () => {
            const puzzle = generate(rng);
            const hint = getHint(puzzle);
            if (hint) {
                expect(hint).toHaveProperty('gateId');
                expect(hint).toHaveProperty('answer');
                expect([0, 1]).toContain(hint.answer);
            }
        });
    });
});
