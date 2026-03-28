import { createSlice } from '@reduxjs/toolkit';
import { MAX_HINTS } from '../utils/constants.js';

const initialState = {
    currentPuzzle: null,
    userAnswer: null,
    hintsUsed: 0,
    hintsRemaining: MAX_HINTS,
    timerSeconds: 0,
    timerRunning: false,
    solved: false,
    failed: false,
    showResult: false,
    currentRound: 0,    // for multi-round puzzles
    loading: false,
    selectedDifficulty: null, // 'novice' | 'intermediate' | 'expert'
    hintedCells: [],    // Array of { row, col, value } or { gateId, value } etc.
    mistakesMade: 0,    // total incorrect submissions
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setPuzzle(state, action) {
            state.currentPuzzle = action.payload;
            state.userAnswer = null;
            state.hintsUsed = 0;
            state.hintsRemaining = MAX_HINTS;
            state.timerSeconds = 0;
            state.timerRunning = true;
            state.solved = false;
            state.failed = false;
            state.showResult = false;
            state.currentRound = 0;
            state.loading = false;
            state.hintedCells = [];
            state.mistakesMade = 0;
        },
        updateAnswer(state, action) {
            state.userAnswer = action.payload;
        },
        useHint(state) {
            if (state.hintsRemaining > 0) {
                state.hintsUsed += 1;
                state.hintsRemaining -= 1;
            }
        },
        /**
         * Record a hinted cell so the renderer can animate it
         * with Bluestock Orange highlight.
         */
        addHintedCell(state, action) {
            state.hintedCells.push(action.payload);
        },
        recordMistake(state) {
            state.mistakesMade += 1;
        },
        tickTimer(state) {
            if (state.timerRunning) {
                state.timerSeconds += 1;
            }
        },
        stopTimer(state) {
            state.timerRunning = false;
        },
        markSolved(state) {
            state.solved = true;
            state.timerRunning = false;
            state.showResult = true;
        },
        markFailed(state) {
            state.failed = true;
            state.showResult = true;
        },
        nextRound(state) {
            state.currentRound += 1;
        },
        resetGame() {
            return initialState;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setDifficulty(state, action) {
            state.selectedDifficulty = action.payload;
        },
    },
});

export const {
    setPuzzle,
    updateAnswer,
    useHint,
    addHintedCell,
    recordMistake,
    tickTimer,
    stopTimer,
    markSolved,
    markFailed,
    nextRound,
    resetGame,
    setLoading,
    setDifficulty,
} = gameSlice.actions;

export default gameSlice.reducer;
