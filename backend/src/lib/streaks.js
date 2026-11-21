/**
 * Streaks with streak freezes.
 *
 * KEEP IN SYNC with frontend/src/utils/streakCalculator.js. See that file
 * for the rules. Same algorithm, so the leaderboard shows the streak players see.
 */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

const DAY_MS = 86400000;
const toMs = (d) => Date.parse(`${d}T00:00:00Z`);
const toStr = (ms) => new Date(ms).toISOString().slice(0, 10);

export function calculateStreaks(solvedDates, pendingFrom) {
    const solved = new Set(solvedDates);
    if (solved.size === 0) return { currentStreak: 0, longestStreak: 0, freezesAvailable: 0 };

    const sorted = [...solved].sort();
    const last = sorted[sorted.length - 1];
    const end = last > pendingFrom ? last : pendingFrom;

    let run = 0;
    let longest = 0;
    let freezes = 0;

    for (let t = toMs(sorted[0]); t <= toMs(end); t += DAY_MS) {
        const d = toStr(t);
        if (solved.has(d)) {
            run++;
            longest = Math.max(longest, run);
            if (run % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) freezes++;
        } else if (d >= pendingFrom) {
            // still open
        } else if (run > 0 && freezes > 0) {
            freezes--;
        } else {
            run = 0;
        }
    }

    return { currentStreak: run, longestStreak: longest, freezesAvailable: freezes };
}

/**
 * The server doesn't know each player's timezone. Treat both UTC-yesterday and
 * UTC-today as still open, so a player behind UTC isn't shown a broken streak
 * before their local day has ended.
 */
export function serverPendingFrom() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}
