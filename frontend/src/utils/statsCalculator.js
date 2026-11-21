import dayjs from 'dayjs';
import { PUZZLE_TYPES, HISTORY_PUZZLE_TYPES, ACHIEVEMENTS } from './constants.js';
import { calculateStreaks } from './streakCalculator.js';
import { getHistoricalTypeForDate } from '../engine/generator.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map(a => a.id));

function toInt(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/**
 * Bring a solve from any source into one canonical shape:
 *   - local IndexedDB records (`score`, v1.0 and v1.1)
 *   - server DailyScore rows (`points`)
 *   - legacy heatmap pairs recovered from old stats snapshots ({ date, points, legacy: true })
 * Returns null for anything that isn't a real solve.
 */
export function normalizeEntry(raw) {
    if (!raw || typeof raw.date !== 'string' || !DATE_RE.test(raw.date)) return null;
    if (raw.solved === false) return null;
    const points = toInt(raw.points ?? raw.score);
    if (points <= 0) return null;

    const legacy = Boolean(raw.legacy);
    return {
        date: raw.date,
        points,
        // Puzzle type is deterministic from the date, so it can be rebuilt for legacy data.
        // History may hold retired types (e.g. Pattern Match): keep them as recorded
        puzzleType: HISTORY_PUZZLE_TYPES.includes(raw.puzzleType) ? raw.puzzleType : getHistoricalTypeForDate(raw.date),
        timeSeconds: legacy ? 0 : toInt(raw.timeSeconds),
        hintsUsed: legacy ? 0 : toInt(raw.hintsUsed),
        mistakes: legacy ? 0 : toInt(raw.mistakes),
        noMistakes: legacy ? false : Boolean(raw.noMistakes),
        solvedAt: typeof raw.solvedAt === 'string' ? raw.solvedAt : null,
        legacy,
    };
}

/**
 * Conflict rule when two sources disagree about the same day. Same rule as the
 * server: the higher score wins, and a full record beats a legacy score-only one.
 */
export function isBetterEntry(candidate, existing) {
    if (!existing) return true;
    if (candidate.points > existing.points) return true;
    return existing.legacy && !candidate.legacy && candidate.points >= existing.points;
}

/** Turn a v1.0 heatmapData object ({ 'YYYY-MM-DD': points }) into legacy entries. */
export function entriesFromHeatmap(heatmapData) {
    if (!heatmapData || typeof heatmapData !== 'object') return [];
    return Object.entries(heatmapData)
        .map(([date, points]) => normalizeEntry({ date, points, legacy: true }))
        .filter(Boolean);
}

/**
 * Derive every stat shown in the app from the solve history.
 * Nothing is stored as a running counter any more, so the streak, heatmap,
 * totals and badges can never disagree with each other or drift.
 *
 * @param {Array} entries                normalized entries (any order)
 * @param {string[]} keptAchievements    badges already earned (never removed)
 */
export function deriveStats(entries, keptAchievements = []) {
    const list = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    const heatmapData = {};
    for (const e of list) heatmapData[e.date] = e.points;

    const timed = list.filter(e => !e.legacy && e.timeSeconds > 0);
    const totalPoints = list.reduce((s, e) => s + e.points, 0);
    const averageTime = timed.length ? Math.round(timed.reduce((s, e) => s + e.timeSeconds, 0) / timed.length) : 0;
    const fastestSolve = timed.length ? Math.min(...timed.map(e => e.timeSeconds)) : null;
    // Only types still in play count toward "types mastered" and the Well Rounded badge
    const solvedTypes = PUZZLE_TYPES.filter(t => list.some(e => e.puzzleType === t));
    const today = dayjs().format('YYYY-MM-DD');
    const {
        currentStreak, longestStreak, freezesAvailable, frozenDates, freezeEarnedDates, nextFreezeIn,
    } = calculateStreaks(list.map(e => e.date), today);

    // Consecutive most-recent solves with no wrong submissions
    let perfectStreak = 0;
    for (let i = list.length - 1; i >= 0 && list[i].noMistakes; i--) perfectStreak++;

    const earned = new Set(keptAchievements.filter(id => ACHIEVEMENT_IDS.has(id)));
    const unlock = (cond, id) => { if (cond) earned.add(id); };
    unlock(list.length >= 1, 'first_solve');
    unlock(longestStreak >= 3, 'streak_3');
    unlock(longestStreak >= 7, 'streak_7');
    unlock(longestStreak >= 30, 'streak_30');
    unlock(list.some(e => !e.legacy && e.hintsUsed === 0), 'no_hints'); // was never awarded before v1.1
    unlock(fastestSolve !== null && fastestSolve < 60, 'speed_demon');
    unlock(solvedTypes.length >= PUZZLE_TYPES.length, 'all_types');
    unlock(list.filter(e => e.noMistakes).length >= 10, 'perfect_10');
    for (const e of list) {
        if (!e.solvedAt) continue;
        const hour = dayjs(e.solvedAt).hour();
        unlock(hour >= 0 && hour < 5, 'night_owl');
        unlock(hour >= 5 && hour < 7, 'early_bird');
    }

    return {
        currentStreak,
        longestStreak,
        freezesAvailable,       // streak freezes in the bank (0-2)
        frozenDates,            // missed days a freeze covered
        freezeEarnedDates,      // days a freeze was earned
        nextFreezeIn,           // solves until the next freeze (null when full)
        totalSolved: list.length,
        totalPoints,
        averageTime,
        fastestSolve,
        lastSolveDate: list.length ? list[list.length - 1].date : null,
        heatmapData,
        solvedTypes,
        perfectStreak,
        // Keep the display order of ACHIEVEMENTS
        achievements: ACHIEVEMENTS.map(a => a.id).filter(id => earned.has(id)),
    };
}
