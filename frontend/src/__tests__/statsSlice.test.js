/**
 * Tests for store/statsSlice.js — Redux stats state management.
 */
import statsReducer, {
    recordSolve,
    loadStats,
    resetStats,
} from '../store/statsSlice.js';

const initialState = {
    currentStreak: 0,
    longestStreak: 0,
    totalSolved: 0,
    totalPoints: 0,
    averageTime: 0,
    lastSolveDate: null,
    heatmapData: {},
    solvedTypes: [],
    achievements: [],
    perfectStreak: 0,
    fastestSolve: null,
};

describe('statsSlice', () => {
    it('has correct initial state', () => {
        const state = statsReducer(undefined, { type: '@@INIT' });
        expect(state).toEqual(initialState);
    });

    describe('recordSolve', () => {
        it('increments totalSolved and totalPoints', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 85,
                    timeSeconds: 120,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            expect(state.totalSolved).toBe(1);
            expect(state.totalPoints).toBe(85);
        });

        it('starts streak at 1 on first solve', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 100,
                    timeSeconds: 60,
                    puzzleType: 'numberMatrix',
                    noMistakes: true,
                }),
            );
            expect(state.currentStreak).toBe(1);
            expect(state.longestStreak).toBe(1);
            expect(state.lastSolveDate).toBe('2026-02-17');
        });

        it('increments streak on consecutive day', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-16',
                    points: 80,
                    timeSeconds: 100,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 90,
                    timeSeconds: 90,
                    puzzleType: 'patternMatch',
                    noMistakes: true,
                }),
            );
            expect(state.currentStreak).toBe(2);
            expect(state.longestStreak).toBe(2);
        });

        it('resets streak on gap day', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-14',
                    points: 80,
                    timeSeconds: 100,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 90,
                    timeSeconds: 90,
                    puzzleType: 'patternMatch',
                    noMistakes: false,
                }),
            );
            expect(state.currentStreak).toBe(1);
        });

        it('does not increment streak on same day', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 100,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 90,
                    timeSeconds: 90,
                    puzzleType: 'patternMatch',
                    noMistakes: false,
                }),
            );
            expect(state.currentStreak).toBe(1);
        });

        it('updates heatmapData', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 85,
                    timeSeconds: 120,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            expect(state.heatmapData['2026-02-17']).toBe(85);
        });

        it('accumulates heatmapData for same date', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 50,
                    timeSeconds: 60,
                    puzzleType: 'a',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 30,
                    timeSeconds: 60,
                    puzzleType: 'b',
                    noMistakes: false,
                }),
            );
            expect(state.heatmapData['2026-02-17']).toBe(80);
        });

        it('tracks solved types without duplicates', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 60,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-18',
                    points: 80,
                    timeSeconds: 60,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            expect(state.solvedTypes).toEqual(['numberMatrix']);
        });

        it('calculates running average time', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-16',
                    points: 80,
                    timeSeconds: 100,
                    puzzleType: 'a',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 200,
                    puzzleType: 'b',
                    noMistakes: false,
                }),
            );
            expect(state.averageTime).toBe(150);
        });

        it('tracks fastest solve', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-16',
                    points: 80,
                    timeSeconds: 200,
                    puzzleType: 'a',
                    noMistakes: false,
                }),
            );
            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 50,
                    puzzleType: 'b',
                    noMistakes: false,
                }),
            );
            expect(state.fastestSolve).toBe(50);
        });

        it('counts perfect streak', () => {
            let state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-16',
                    points: 80,
                    timeSeconds: 60,
                    puzzleType: 'a',
                    noMistakes: true,
                }),
            );
            expect(state.perfectStreak).toBe(1);

            state = statsReducer(
                state,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 60,
                    puzzleType: 'b',
                    noMistakes: false,
                }),
            );
            expect(state.perfectStreak).toBe(0);
        });

        it('unlocks first_solve achievement', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 120,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            expect(state.achievements).toContain('first_solve');
        });

        it('unlocks speed_demon for < 60s solve', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 30,
                    puzzleType: 'numberMatrix',
                    noMistakes: false,
                }),
            );
            expect(state.achievements).toContain('speed_demon');
        });

        it('unlocks no_hints when noMistakes is true', () => {
            const state = statsReducer(
                initialState,
                recordSolve({
                    date: '2026-02-17',
                    points: 80,
                    timeSeconds: 60,
                    puzzleType: 'numberMatrix',
                    noMistakes: true,
                }),
            );
            expect(state.achievements).toContain('no_hints');
        });

        it('unlocks streak_3 on third consecutive day', () => {
            let state = initialState;
            for (let i = 0; i < 3; i++) {
                state = statsReducer(
                    state,
                    recordSolve({
                        date: `2026-02-${15 + i}`,
                        points: 80,
                        timeSeconds: 60,
                        puzzleType: 'numberMatrix',
                        noMistakes: false,
                    }),
                );
            }
            expect(state.currentStreak).toBe(3);
            expect(state.achievements).toContain('streak_3');
        });
    });

    describe('loadStats', () => {
        it('merges payload into state', () => {
            const state = statsReducer(
                initialState,
                loadStats({ totalSolved: 10, currentStreak: 5, heatmapData: { '2026-01-01': 80 } }),
            );
            expect(state.totalSolved).toBe(10);
            expect(state.currentStreak).toBe(5);
            expect(state.heatmapData['2026-01-01']).toBe(80);
        });
    });

    describe('resetStats', () => {
        it('returns to initial state', () => {
            const dirty = {
                ...initialState,
                totalSolved: 50,
                currentStreak: 10,
                achievements: ['first_solve'],
            };
            const state = statsReducer(dirty, resetStats());
            expect(state).toEqual(initialState);
        });
    });
});
