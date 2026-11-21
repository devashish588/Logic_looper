import { createSlice } from '@reduxjs/toolkit';
import { deriveStats, normalizeEntry, isBetterEntry } from '../utils/statsCalculator.js';

const emptyDerived = deriveStats([]);

const initialState = {
    history: {},            // { 'YYYY-MM-DD': normalized entry }: the source of truth
    ...emptyDerived,        // currentStreak, longestStreak, totals, heatmapData, achievements…
    hydrated: false,        // true once the signed-in user's history has been loaded
    syncStatus: 'idle',     // 'idle' | 'syncing' | 'synced' | 'offline' | 'unauthorized' | 'error'
    lastSyncedAt: null,
    recoveredCount: 0,      // days restored from this device that the server didn't have
};

function recompute(state) {
    Object.assign(state, deriveStats(Object.values(state.history), state.achievements));
}

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        /** Replace the history with a fully merged one (on login / app start). */
        setHistory(state, action) {
            const { entries = [], achievements = [], recoveredCount = 0 } = action.payload || {};
            state.history = {};
            for (const raw of entries) {
                const e = normalizeEntry(raw);
                if (e && isBetterEntry(e, state.history[e.date])) state.history[e.date] = e;
            }
            state.achievements = achievements;
            state.recoveredCount = recoveredCount;
            state.hydrated = true;
            recompute(state);
        },
        /** Add one solve. Ignored if the day already has an equal or better result. */
        recordSolve(state, action) {
            const e = normalizeEntry(action.payload);
            if (!e || !isBetterEntry(e, state.history[e.date])) return;
            state.history[e.date] = e;
            recompute(state);
        },
        /** Recompute date-relative values (current streak) e.g. after midnight. */
        refreshDerived(state) {
            recompute(state);
        },
        setSyncStatus(state, action) {
            state.syncStatus = action.payload;
            if (action.payload === 'synced') state.lastSyncedAt = new Date().toISOString();
        },
        resetStats() {
            return initialState;
        },
    },
});

export const { setHistory, recordSolve, refreshDerived, setSyncStatus, resetStats } = statsSlice.actions;
export default statsSlice.reducer;
