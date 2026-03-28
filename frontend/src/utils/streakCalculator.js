import dayjs from 'dayjs';

/**
 * Calculate current and longest streak from activity entries.
 *
 * @param {Array<{ date: string, solved: boolean }>} entries — sorted by date ascending
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function calculateStreaks(entries) {
    if (!entries || entries.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Build a Set of solved dates for O(1) lookup
    const solvedDates = new Set();
    for (const entry of entries) {
        if (entry.solved) {
            solvedDates.add(entry.date);
        }
    }

    if (solvedDates.size === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // --- Current Streak ---
    // Walk backwards from today (or yesterday if today not yet solved)
    const today = dayjs().format('YYYY-MM-DD');
    let currentStreak = 0;
    let checkDate = dayjs(today);

    // If today is not solved, start checking from yesterday
    if (!solvedDates.has(today)) {
        checkDate = checkDate.subtract(1, 'day');
    }

    while (solvedDates.has(checkDate.format('YYYY-MM-DD'))) {
        currentStreak++;
        checkDate = checkDate.subtract(1, 'day');
    }

    // --- Longest Streak ---
    // Sort all solved dates and find the longest consecutive run
    const sortedDates = Array.from(solvedDates).sort();
    let longestStreak = 1;
    let runLength = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = dayjs(sortedDates[i - 1]);
        const curr = dayjs(sortedDates[i]);
        const diff = curr.diff(prev, 'day');

        if (diff === 1) {
            runLength++;
            longestStreak = Math.max(longestStreak, runLength);
        } else if (diff > 1) {
            runLength = 1;
        }
        // diff === 0 means duplicate date — ignore
    }

    // Ensure longestStreak is at least as big as currentStreak
    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak };
}
