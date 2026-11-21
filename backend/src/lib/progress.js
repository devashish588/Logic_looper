import prisma from './prisma.js';
import { calculateStreaks, serverPendingFrom } from './streaks.js';

// KEEP IN SYNC with PUZZLE_TYPES in frontend/src/utils/constants.js. A type missing here
// makes the server reject every solve of that puzzle (a test checks the two lists match).
export const PUZZLE_TYPES = [
    'numberMatrix', 'sequenceSolver', 'deductionGrid', 'binaryLogic',
    'switchboard', 'laserPath', 'measureUp', 'balanceScale', 'pixelLogic', 'numberTrail',
    'letterLock',
];

// Retired types that players have already solved. They are no longer in the rotation, but their
// history must keep syncing, or restoring an old account would silently drop those days.
export const RETIRED_TYPES = ['patternMatch'];
const ACCEPTED_TYPES = new Set([...PUZZLE_TYPES, ...RETIRED_TYPES]);
export const ACHIEVEMENT_IDS = [
    'first_solve', 'streak_3', 'streak_7', 'streak_30', 'no_hints',
    'speed_demon', 'all_types', 'perfect_10', 'night_owl', 'early_bird',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_POINTS = 1000;
const MAX_SECONDS = 24 * 60 * 60;

function clampInt(value, min, max, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
}

/** Allow "tomorrow" in UTC so players far ahead of UTC can still submit their local today. */
function latestAllowedDate() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Validate and normalize one client-submitted solve.
 * Returns null for anything malformed so a bad entry can't poison a batch.
 */
export function normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const { date, puzzleType } = raw;
    if (typeof date !== 'string' || !DATE_RE.test(date)) return null;
    if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return null;
    if (date > latestAllowedDate()) return null;
    if (!ACCEPTED_TYPES.has(puzzleType)) return null;
    if (raw.points === undefined || raw.points === null) return null;

    let solvedAt = null;
    if (raw.solvedAt) {
        const t = new Date(raw.solvedAt);
        if (!Number.isNaN(t.getTime())) solvedAt = t;
    }

    return {
        date,
        puzzleType,
        points: clampInt(raw.points, 0, MAX_POINTS),
        timeSeconds: clampInt(raw.timeSeconds, 0, MAX_SECONDS),
        hintsUsed: clampInt(raw.hintsUsed, 0, 10),
        mistakes: clampInt(raw.mistakes, 0, 1000),
        noMistakes: Boolean(raw.noMistakes),
        legacy: Boolean(raw.legacy),
        solvedAt,
    };
}

/** Shape a DailyScore row for the client. */
export function toClientEntry(row) {
    return {
        date: row.date,
        puzzleType: row.puzzleType,
        points: row.points,
        timeSeconds: row.timeSeconds,
        hintsUsed: row.hintsUsed,
        mistakes: row.mistakes,
        noMistakes: row.noMistakes,
        legacy: row.legacy,
        solvedAt: row.solvedAt ? row.solvedAt.toISOString() : null,
    };
}

/**
 * Merge solves into DailyScore. Never lowers a stored score: for a date that
 * already exists, the row is only replaced if the incoming entry scored higher.
 * This makes sync idempotent and safe to retry from any device.
 */
export async function mergeEntries(userId, rawEntries) {
    const entries = new Map();
    for (const raw of rawEntries) {
        const e = normalizeEntry(raw);
        if (!e) continue;
        const prev = entries.get(e.date);
        if (!prev || e.points > prev.points) entries.set(e.date, e);
    }
    if (entries.size === 0) return { accepted: 0, written: 0 };

    const existing = await prisma.dailyScore.findMany({
        where: { userId, date: { in: [...entries.keys()] } },
        select: { date: true, points: true, legacy: true },
    });
    const existingByDate = new Map(existing.map(r => [r.date, r]));

    // New days go in with ONE multi-row INSERT. Writing them one statement at a time took tens of
    // seconds for a player with months of history (every statement is a round trip to the database),
    // which timed out the very upload that restores their progress. skipDuplicates also makes two
    // simultaneous uploads (two tabs, a retry) safe instead of failing on the unique (user, date) key.
    const toCreate = [];
    const toUpdate = [];
    for (const e of entries.values()) {
        const prev = existingByDate.get(e.date);
        if (!prev) {
            toCreate.push({ userId, ...e });
        } else if (e.points > prev.points || (prev.legacy && !e.legacy && e.points >= prev.points)) {
            // Higher score wins; a full record also replaces a legacy (score-only) one.
            toUpdate.push(e);
        }
    }
    if (toCreate.length) {
        await prisma.dailyScore.createMany({ data: toCreate, skipDuplicates: true });
    }
    // Replacing a stored day is rare (a better score, or a full record over a recovered one)
    if (toUpdate.length) {
        await prisma.$transaction(toUpdate.map(e => prisma.dailyScore.update({
            where: { userId_date: { userId, date: e.date } },
            data: e,
        })));
    }
    const written = toCreate.length + toUpdate.length;
    return { accepted: entries.size, written };
}

/**
 * Recompute UserStats from the DailyScore history (the source of truth).
 * Achievements are unioned — once earned, never removed.
 */
export async function recomputeUserStats(userId, extraAchievements = []) {
    const rows = await prisma.dailyScore.findMany({ where: { userId }, orderBy: { date: 'asc' } });
    const current = await prisma.userStats.findUnique({ where: { userId } });

    const timed = rows.filter(r => !r.legacy && r.timeSeconds > 0);
    const totalPoints = rows.reduce((s, r) => s + r.points, 0);
    const averageTime = timed.length ? Math.round(timed.reduce((s, r) => s + r.timeSeconds, 0) / timed.length) : 0;
    const fastestSolve = timed.length ? Math.min(...timed.map(r => r.timeSeconds)) : null;
    const solvedTypes = [...new Set(rows.map(r => r.puzzleType))];

    // Same freeze-aware algorithm as the client (lib/streaks.js)
    const { currentStreak, longestStreak } = calculateStreaks(rows.map(r => r.date), serverPendingFrom());
    const lastDate = rows.length ? rows[rows.length - 1].date : null;

    const achievements = [...new Set([
        ...(current?.achievements || []),
        ...extraAchievements.filter(a => ACHIEVEMENT_IDS.includes(a)),
    ])];

    const data = {
        currentStreak,
        longestStreak,
        totalSolved: rows.length,
        totalPoints,
        averageTime,
        fastestSolve,
        lastSolveDate: lastDate,
        solvedTypes,
        achievements,
    };

    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
    });

    return { ...data, history: rows.map(toClientEntry) };
}
