import { createSlice, current } from '@reduxjs/toolkit';
import { MAX_HINTS } from '../utils/constants.js';

const initialState = {
    mode: 'daily',          // 'daily' | 'practice' | 'free'
    dailyStash: null,       // in-progress daily session, set aside while practicing
    currentPuzzle: null,
    userAnswer: null,
    hintsUsed: 0,
    hintsRemaining: MAX_HINTS,
    hints: [],              // text hints revealed so far (the newer games)
    highlight: null,        // what the latest text hint points at: { cells?, jugs?, shapes? }; cleared on the next move
    hintedCells: [],        // value-reveal hints for the original games: { row, col, value } or { gateId, value } etc.
    selectedDifficulty: null, // 'novice' | 'intermediate' | 'expert'
    mistakes: 0,            // wrong submissions this attempt (each costs points)
    mistakesMade: 0,        // total incorrect submissions (kept from the deployed version)
    timerSeconds: 0,
    timerRunning: false,
    solved: false,
    failed: false,
    showResult: false,
    earnedPoints: 0,
    currentRound: 0,        // for multi-round puzzles
    loading: false,
};

// Coming back to a puzzle already in progress: keep the timer, hints and mistakes (so leaving and
// returning can't reset them), but clear entered answers, since the puzzle inputs remount empty.
function resumeSession(s) {
    s.userAnswer = null;
    s.currentRound = 0;
    s.failed = false;
    s.showResult = false;
    s.timerRunning = !s.solved;
    return s;
}

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setPuzzle(state, action) {
            return {
                ...initialState,
                selectedDifficulty: state.selectedDifficulty,
                currentPuzzle: action.payload,
                timerRunning: true,
            };
        },
        /**
         * Open a puzzle. payload: { puzzle, mode: 'daily' | 'practice' | 'free', difficulty? }
         *  - Same puzzle already open → resume it (timer, hints, mistakes, difficulty kept).
         *  - Leaving an unfinished daily puzzle for practice → it is stashed and
         *    restored when the player returns, so practicing can't be used to
         *    reset the daily timer or hints.
         */
        loadPuzzle(state, action) {
            const { puzzle, mode = 'daily', difficulty = null } = action.payload;

            // Puzzles are matched by id (the date for daily/practice, a seed for free play)
            const samePuzzle = state.currentPuzzle?.id === puzzle.id && state.mode === mode;
            if (samePuzzle && !(mode !== 'daily' && state.solved)) {
                resumeSession(state);
                return;
            }

            let stash = state.dailyStash;
            if (state.mode === 'daily' && state.currentPuzzle && !state.solved) {
                stash = { ...current(state), dailyStash: null };
            }
            if (mode === 'daily' && stash?.currentPuzzle?.id === puzzle.id) {
                return resumeSession({ ...stash, dailyStash: null });
            }
            return {
                ...initialState,
                mode,
                currentPuzzle: puzzle,
                selectedDifficulty: difficulty,
                timerRunning: true,
                dailyStash: stash,
            };
        },
        resumePuzzle(state) {
            resumeSession(state);
        },
        updateAnswer(state, action) {
            state.userAnswer = action.payload;
            state.highlight = null;
        },
        /** payload (optional): { text, highlight? } for the newer games' text hints */
        useHint(state, action) {
            if (state.hintsRemaining <= 0) return;
            state.hintsUsed += 1;
            state.hintsRemaining -= 1;
            const hint = action.payload;
            if (hint?.text) state.hints.push(hint.text);
            state.highlight = hint?.highlight || null;
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
        setDifficulty(state, action) {
            state.selectedDifficulty = action.payload;
        },
        tickTimer(state) {
            if (state.timerRunning) {
                state.timerSeconds += 1;
            }
        },
        stopTimer(state) {
            state.timerRunning = false;
        },
        markSolved(state, action) {
            state.solved = true;
            state.timerRunning = false;
            state.showResult = true;
            state.earnedPoints = action?.payload?.points ?? 0;
        },
        markFailed(state) {
            state.failed = true;
            state.mistakes += 1;
            state.mistakesMade += 1;
            state.showResult = true;
        },
        /**
         * Close the "not quite right" dialog and keep going. The timer, hints
         * and entered answers are kept. Before v1.1 "Try again" restarted the
         * puzzle and reset the timer and hint count, which made failing free.
         */
        retry(state) {
            state.failed = false;
            state.showResult = false;
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
    },
});

export const {
    setPuzzle,
    loadPuzzle,
    resumePuzzle,
    updateAnswer,
    useHint,
    addHintedCell,
    recordMistake,
    setDifficulty,
    tickTimer,
    stopTimer,
    markSolved,
    markFailed,
    retry,
    nextRound,
    resetGame,
    setLoading,
} = gameSlice.actions;

export default gameSlice.reducer;
