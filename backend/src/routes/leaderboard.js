import express from 'express';
import prisma from '../lib/prisma.js';
import { calculateStreaks, serverPendingFrom } from '../lib/streaks.js';

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseLimit(value, fallback = 50) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : fallback;
}

/**
 * Public name for the leaderboard. Sign-up defaults displayName to the part of
 * the email before "@", so in that case show a neutral handle instead of
 * leaking part of someone's email address.
 */
function displayNameOf(user, userId) {
    const name = user?.displayName?.trim();
    const emailLocal = user?.email?.split('@')[0];
    if (!name || (emailLocal && name.toLowerCase() === emailLocal.toLowerCase())) {
        return `Player ${String(userId).slice(0, 4).toUpperCase()}`;
    }
    return name;
}

// GET /api/leaderboard?period=alltime|week&limit=50 — top players by points
router.get('/', async (req, res, next) => {
    try {
        const period = req.query.period === 'week' ? 'week' : 'alltime';
        const limit = parseLimit(req.query.limit);

        const where = {};
        if (period === 'week') {
            const since = new Date();
            since.setUTCDate(since.getUTCDate() - 6);
            where.date = { gte: since.toISOString().slice(0, 10) };
        }

        const grouped = await prisma.dailyScore.groupBy({
            by: ['userId'],
            where,
            _sum: { points: true },
            _count: { _all: true },
            orderBy: { _sum: { points: 'desc' } },
            take: limit,
        });

        const userIds = grouped.map(g => g.userId);
        const [users, dates] = await Promise.all([
            prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, displayName: true, email: true },
            }),
            // Streaks computed live: a stored value goes stale once someone stops playing.
            prisma.dailyScore.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, date: true },
            }),
        ]);
        const byId = new Map(users.map(u => [u.id, u]));
        const datesByUser = new Map();
        for (const { userId, date } of dates) {
            if (!datesByUser.has(userId)) datesByUser.set(userId, []);
            datesByUser.get(userId).push(date);
        }
        const pendingFrom = serverPendingFrom();

        res.json({
            period,
            entries: grouped.map((g, i) => {
                const u = byId.get(g.userId);
                const streaks = calculateStreaks(datesByUser.get(g.userId) || [], pendingFrom);
                return {
                    rank: i + 1,
                    userId: g.userId,
                    displayName: displayNameOf(u, g.userId),
                    points: g._sum.points || 0,
                    solved: g._count._all,
                    streak: streaks.currentStreak,
                    bestStreak: streaks.longestStreak,
                };
            }),
            updatedAt: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/leaderboard/daily?date=YYYY-MM-DD — best solves for one day
router.get('/daily', async (req, res, next) => {
    try {
        const date = DATE_RE.test(req.query.date || '') ? req.query.date : new Date().toISOString().slice(0, 10);
        const limit = parseLimit(req.query.limit);

        const rows = await prisma.dailyScore.findMany({
            where: { date, legacy: false },
            orderBy: [{ points: 'desc' }, { timeSeconds: 'asc' }, { createdAt: 'asc' }],
            take: limit,
            include: { user: { select: { displayName: true, email: true } } },
        });

        res.json({
            period: 'today',
            date,
            entries: rows.map((r, i) => ({
                rank: i + 1,
                userId: r.userId,
                displayName: displayNameOf(r.user, r.userId),
                points: r.points,
                timeSeconds: r.timeSeconds,
                hintsUsed: r.hintsUsed,
                puzzleType: r.puzzleType,
            })),
            updatedAt: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

export default router;
