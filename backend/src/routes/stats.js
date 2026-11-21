import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { mergeEntries, recomputeUserStats, toClientEntry } from '../lib/progress.js';

const router = express.Router();

const MAX_BATCH = 2000; // > 5 years of daily solves

async function buildStatsResponse(userId) {
    const [userStats, rows] = await Promise.all([
        prisma.userStats.findUnique({ where: { userId } }),
        prisma.dailyScore.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    ]);

    const heatmapData = {};
    for (const r of rows) heatmapData[r.date] = r.points;

    return {
        userId,
        currentStreak: userStats?.currentStreak || 0,
        longestStreak: userStats?.longestStreak || 0,
        totalSolved: userStats?.totalSolved || 0,
        totalPoints: userStats?.totalPoints || 0,
        averageTime: userStats?.averageTime || 0,
        fastestSolve: userStats?.fastestSolve || null,
        lastSolveDate: userStats?.lastSolveDate || null,
        solvedTypes: userStats?.solvedTypes || [],
        achievements: userStats?.achievements || [],
        heatmapData,
        history: rows.map(toClientEntry),
    };
}

// GET /api/stats/me — full progress for the signed-in user (stats + solve history)
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        res.json(await buildStatsResponse(req.user.userId));
    } catch (err) {
        next(err);
    }
});

// POST /api/stats/batch-sync — merge solves from the client.
// Body: { entries: [{ date, puzzleType, points, timeSeconds, hintsUsed, mistakes, noMistakes, solvedAt, legacy }], achievements?: string[] }
// Merge-only: a stored day is never deleted or lowered, so retries and multiple devices are safe.
router.post('/batch-sync', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { entries = [], achievements = [] } = req.body || {};

        if (!Array.isArray(entries) || !Array.isArray(achievements)) {
            return res.status(400).json({ error: 'entries and achievements must be arrays' });
        }
        if (entries.length > MAX_BATCH) {
            return res.status(413).json({ error: `At most ${MAX_BATCH} entries per request` });
        }

        const { accepted, written } = await mergeEntries(userId, entries);
        const stats = await recomputeUserStats(userId, achievements);

        res.json({
            message: 'Batch sync complete',
            synced: accepted,
            written,
            rejected: entries.length - accepted,
            stats: { ...stats, history: undefined },
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/stats/daily — record a single solve (same merge rules as batch-sync)
router.post('/daily', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { accepted } = await mergeEntries(userId, [req.body]);
        if (!accepted) {
            return res.status(400).json({ error: 'A valid date, puzzleType, and points are required' });
        }
        await recomputeUserStats(userId);
        res.json({ message: 'Daily score recorded', date: req.body.date });
    } catch (err) {
        next(err);
    }
});

// POST /api/stats/sync — legacy endpoint. Used to blindly overwrite counters with
// whatever the client sent (an empty client wiped the account). Now it only
// unions achievements; all numbers are derived from the DailyScore history.
router.post('/sync', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const achievements = Array.isArray(req.body?.stats?.achievements) ? req.body.stats.achievements : [];
        await recomputeUserStats(userId, achievements);
        res.json({ message: 'Stats synced successfully', userId, syncedAt: new Date().toISOString() });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/stats/me — the explicit "Reset all progress" action from Settings
router.delete('/me', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await prisma.$transaction([
            prisma.dailyScore.deleteMany({ where: { userId } }),
            prisma.userStats.upsert({
                where: { userId },
                create: { userId },
                update: {
                    currentStreak: 0, longestStreak: 0, totalSolved: 0, totalPoints: 0,
                    averageTime: 0, fastestSolve: null, lastSolveDate: null,
                    solvedTypes: [], achievements: [],
                },
            }),
        ]);
        res.json({ message: 'Progress reset' });
    } catch (err) {
        next(err);
    }
});

// GET /api/stats/:userId — kept for older clients; only your own stats
router.get('/:userId', authenticateToken, async (req, res, next) => {
    try {
        if (req.params.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        res.json(await buildStatsResponse(req.user.userId));
    } catch (err) {
        next(err);
    }
});

export default router;
