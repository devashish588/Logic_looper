/**
 * Streaks with streak freezes.
 *
 * KEEP IN SYNC with backend/src/lib/streaks.js (same algorithm, so the
 * leaderboard shows the same streak the player sees).
 *
 * Rules:
 *  - Every FREEZE_EVERY consecutive solved days in a streak earns a freeze
 *    (holding at most MAX_FREEZES).
 *  - A missed day automatically uses a freeze, and the streak survives. Frozen
 *    days don't add to the streak count; they just keep it alive.
 *  - With no freeze available, a missed day ends the streak. Unused freezes
 *    are kept for the next streak.
 *  - Days on or after `pendingFrom` that aren't solved yet don't count as
 *    missed (today is still in progress).
 *
 * Freezes are derived from history, never stored, so they can't get out of
 * sync and they apply retroactively to existing history.
 *
 * Dates are 'YYYY-MM-DD' strings; arithmetic is done in UTC so it's immune
 * to daylight-saving changes.
 */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

const DAY_MS = 86400000;
const toMs = (d) => Date.parse(`${d}T00:00:00Z`);
const toStr = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * @param {Iterable<string>} solvedDates
 * @param {string} pendingFrom  first date that is still "open" (usually today)
 */
export function calculateStreaks(solvedDates, pendingFrom) {
    const solved = new Set(solvedDates);
    const empty = {
        currentStreak: 0, longestStreak: 0, freezesAvailable: 0,
        frozenDates: [], freezeEarnedDates: [], nextFreezeIn: FREEZE_EVERY,
    };
    if (solved.size === 0) return empty;

    const sorted = [...solved].sort();
    const last = sorted[sorted.length - 1];
    const end = last > pendingFrom ? last : pendingFrom;

    let run = 0;
    let longest = 0;
    let freezes = 0;
    const frozenDates = [];
    const freezeEarnedDates = [];

    for (let t = toMs(sorted[0]); t <= toMs(end); t += DAY_MS) {
        const d = toStr(t);
        if (solved.has(d)) {
            run++;
            longest = Math.max(longest, run);
            if (run % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) {
                freezes++;
                freezeEarnedDates.push(d);
            }
        } else if (d >= pendingFrom) {
            // Still open: not missed yet.
        } else if (run > 0 && freezes > 0) {
            freezes--;
            frozenDates.push(d);
        } else {
            run = 0;
        }
    }

    return {
        currentStreak: run,
        longestStreak: longest,
        freezesAvailable: freezes,
        frozenDates,
        freezeEarnedDates,
        nextFreezeIn: freezes >= MAX_FREEZES ? null : FREEZE_EVERY - (run % FREEZE_EVERY),
    };
}
