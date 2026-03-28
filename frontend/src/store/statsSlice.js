import { createSlice } from '@reduxjs/toolkit';
import { ACHIEVEMENTS } from '../utils/constants.js';

const initialState = {
    currentStreak: 0,
    longestStreak: 0,
    totalSolved: 0,
    totalPoints: 0,
    averageTime: 0,
    lastSolveDate: null,
    heatmapData: {},       // { 'YYYY-MM-DD': score }
    solvedTypes: [],        // unique puzzle types solved
    achievements: [],       // unlocked achievement IDs
    perfectStreak: 0,       // consecutive no-mistake solves
    fastestSolve: null,     // in seconds
};

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        recordSolve(state, action) {
            const { date, points, timeSeconds, puzzleType, noMistakes } = action.payload;

            // Update streak
            if (state.lastSolveDate) {
                const lastDate = new Date(state.lastSolveDate);
                const today = new Date(date);
                const diff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                    state.currentStreak += 1;
                } else if (diff > 1) {
                    state.currentStreak = 1;
                }
                // same day — don't increment
            } else {
                state.currentStreak = 1;
            }

            state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
            state.lastSolveDate = date;
            state.totalSolved += 1;
            state.totalPoints += points;

            // Running average time
            state.averageTime = Math.round(
                ((state.averageTime * (state.totalSolved - 1)) + timeSeconds) / state.totalSolved
            );

            // Heatmap
            state.heatmapData[date] = (state.heatmapData[date] || 0) + points;

            // Track solved types
            if (!state.solvedTypes.includes(puzzleType)) {
                state.solvedTypes.push(puzzleType);
            }

            // Perfect streak
            if (noMistakes) {
                state.perfectStreak += 1;
            } else {
                state.perfectStreak = 0;
            }

            // Fastest
            if (!state.fastestSolve || timeSeconds < state.fastestSolve) {
                state.fastestSolve = timeSeconds;
            }

            // Check achievements
            checkAchievements(state, timeSeconds);
        },
        loadStats(state, action) {
            return { ...state, ...action.payload };
        },
        resetStats() {
            return initialState;
        },
    },
});

function checkAchievements(state, timeSeconds) {
    const unlock = (id) => {
        if (!state.achievements.includes(id)) {
            state.achievements.push(id);
        }
    };

    if (state.totalSolved >= 1) unlock('first_solve');
    if (state.currentStreak >= 3) unlock('streak_3');
    if (state.currentStreak >= 7) unlock('streak_7');
    if (state.currentStreak >= 30) unlock('streak_30');
    if (timeSeconds < 60) unlock('speed_demon');
    if (state.solvedTypes.length >= 5) unlock('all_types');
    if (state.perfectStreak >= 10) unlock('perfect_10');

    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlock('night_owl');
    if (hour >= 5 && hour < 7) unlock('early_bird');
}

export const { recordSolve, loadStats, resetStats } = statsSlice.actions;
export default statsSlice.reducer;
