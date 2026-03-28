/**
 * Tests for store/gameSlice.js — Redux game state management.
 */
import gameReducer, {
    setPuzzle,
    updateAnswer,
    useHint,
    tickTimer,
    stopTimer,
    markSolved,
    markFailed,
    nextRound,
    resetGame,
    setLoading,
} from '../store/gameSlice.js';

const initialState = {
    currentPuzzle: null,
    userAnswer: null,
    hintsUsed: 0,
    hintsRemaining: 3,
    timerSeconds: 0,
    timerRunning: false,
    solved: false,
    failed: false,
    showResult: false,
    currentRound: 0,
    loading: false,
};

describe('gameSlice', () => {
    it('has correct initial state', () => {
        const state = gameReducer(undefined, { type: '@@INIT' });
        expect(state).toEqual(initialState);
    });

    describe('setPuzzle', () => {
        it('sets puzzle and resets all game state', () => {
            const puzzle = { type: 'numberMatrix', data: 'test' };
            const state = gameReducer(initialState, setPuzzle(puzzle));
            expect(state.currentPuzzle).toEqual(puzzle);
            expect(state.timerRunning).toBe(true);
            expect(state.solved).toBe(false);
            expect(state.hintsUsed).toBe(0);
            expect(state.hintsRemaining).toBe(3);
            expect(state.userAnswer).toBeNull();
            expect(state.currentRound).toBe(0);
            expect(state.loading).toBe(false);
        });
    });

    describe('updateAnswer', () => {
        it('sets userAnswer', () => {
            const state = gameReducer(initialState, updateAnswer([1, 2, 3]));
            expect(state.userAnswer).toEqual([1, 2, 3]);
        });
    });

    describe('useHint', () => {
        it('decrements hintsRemaining and increments hintsUsed', () => {
            const state = gameReducer(initialState, useHint());
            expect(state.hintsUsed).toBe(1);
            expect(state.hintsRemaining).toBe(2);
        });

        it('does nothing when hintsRemaining is 0', () => {
            const noHints = { ...initialState, hintsRemaining: 0, hintsUsed: 3 };
            const state = gameReducer(noHints, useHint());
            expect(state.hintsUsed).toBe(3);
            expect(state.hintsRemaining).toBe(0);
        });
    });

    describe('tickTimer', () => {
        it('increments timerSeconds when running', () => {
            const running = { ...initialState, timerRunning: true };
            const state = gameReducer(running, tickTimer());
            expect(state.timerSeconds).toBe(1);
        });

        it('does not increment when timer is stopped', () => {
            const state = gameReducer(initialState, tickTimer());
            expect(state.timerSeconds).toBe(0);
        });
    });

    describe('stopTimer', () => {
        it('sets timerRunning to false', () => {
            const running = { ...initialState, timerRunning: true };
            const state = gameReducer(running, stopTimer());
            expect(state.timerRunning).toBe(false);
        });
    });

    describe('markSolved', () => {
        it('sets solved, stops timer, shows result', () => {
            const running = { ...initialState, timerRunning: true };
            const state = gameReducer(running, markSolved());
            expect(state.solved).toBe(true);
            expect(state.timerRunning).toBe(false);
            expect(state.showResult).toBe(true);
        });
    });

    describe('markFailed', () => {
        it('sets failed and shows result', () => {
            const state = gameReducer(initialState, markFailed());
            expect(state.failed).toBe(true);
            expect(state.showResult).toBe(true);
        });
    });

    describe('nextRound', () => {
        it('increments currentRound', () => {
            const state = gameReducer(initialState, nextRound());
            expect(state.currentRound).toBe(1);
        });
    });

    describe('resetGame', () => {
        it('returns to initial state', () => {
            const dirty = {
                ...initialState,
                solved: true,
                timerSeconds: 120,
                hintsUsed: 3,
            };
            const state = gameReducer(dirty, resetGame());
            expect(state).toEqual(initialState);
        });
    });

    describe('setLoading', () => {
        it('sets loading state', () => {
            const state = gameReducer(initialState, setLoading(true));
            expect(state.loading).toBe(true);
        });
    });
});
