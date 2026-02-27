import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/stats/sync — Sync user stats from client (authenticated)
router.post('/sync', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { stats } = req.body;

        if (!stats) {
            return res.status(400).json({ error: 'stats object is required' });
        }

        await prisma.userStats.upsert({
            where: { userId },
            create: {
                userId,
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0,
                totalSolved: stats.totalSolved || 0,
                totalPoints: stats.totalPoints || 0,
                averageTime: stats.averageTime || 0,
                fastestSolve: stats.fastestSolve || null,
                lastSolveDate: stats.lastSolveDate || null,
                solvedTypes: stats.solvedTypes || [],
                achievements: stats.achievements || [],
            },
            update: {
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0,
                totalSolved: stats.totalSolved || 0,
                totalPoints: stats.totalPoints || 0,
                averageTime: stats.averageTime || 0,
                fastestSolve: stats.fastestSolve || null,
                lastSolveDate: stats.lastSolveDate || null,
                solvedTypes: stats.solvedTypes || [],
                achievements: stats.achievements || [],
            },
        });

        res.json({
            message: 'Stats synced successfully',
            userId,
            syncedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Stats sync error:', err);
        res.status(500).json({ error: 'Failed to sync stats' });
    }
});

// GET /api/stats/:userId — Get user stats (authenticated)
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Only allow fetching own stats
        if (userId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [userStats, dailyScores] = await Promise.all([
            prisma.userStats.findUnique({ where: { userId } }),
            prisma.dailyScore.findMany({
                where: { userId },
                orderBy: { date: 'asc' },
            }),
        ]);

        const heatmapData = {};
        dailyScores.forEach(s => {
            heatmapData[s.date] = (heatmapData[s.date] || 0) + s.points;
        });

        res.json({
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
            perfectStreak: 0,
        });
    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/stats/daily — Record a daily solve (authenticated)
router.post('/daily', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date, puzzleType, points, timeSeconds, hintsUsed, noMistakes } = req.body;

        if (!date || !puzzleType || points === undefined) {
            return res.status(400).json({ error: 'date, puzzleType, and points are required' });
        }

        // Validation guards
        const today = new Date().toISOString().slice(0, 10);
        if (date > today) {
            return res.status(400).json({ error: 'Future dates are not allowed' });
        }
        if (typeof points !== 'number' || points < 0 || points > 200) {
            return res.status(400).json({ error: 'Points must be between 0 and 200' });
        }
        if (timeSeconds !== undefined && (timeSeconds < 0 || timeSeconds > 3600)) {
            return res.status(400).json({ error: 'Time must be between 0 and 3600 seconds' });
        }

        // Upsert daily score (one solve per day per user)
        await prisma.dailyScore.upsert({
            where: { userId_date: { userId, date } },
            create: {
                userId,
                date,
                puzzleType,
                points,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            },
            update: {
                puzzleType,
                points,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            },
        });

        res.json({ message: 'Daily score recorded', date, points });
    } catch (err) {
        console.error('Daily score error:', err);
        res.status(500).json({ error: 'Failed to record daily score' });
    }
});

// POST /api/stats/batch-sync — Batch sync daily scores from client (authenticated)
router.post('/batch-sync', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { entries } = req.body;

        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'entries array is required' });
        }

        let syncedCount = 0;
        const today = new Date().toISOString().slice(0, 10);

        for (const entry of entries) {
            const { date, puzzleType, points, timeSeconds, hintsUsed, noMistakes } = entry;
            if (!date || !puzzleType || points === undefined) continue;

            // Validation: skip invalid entries
            if (date > today) continue;
            if (typeof points !== 'number' || points < 0 || points > 200) continue;
            if (timeSeconds !== undefined && (timeSeconds < 0 || timeSeconds > 3600)) continue;

            await prisma.dailyScore.upsert({
                where: { userId_date: { userId, date } },
                create: {
                    userId,
                    date,
                    puzzleType,
                    points,
                    timeSeconds: timeSeconds || 0,
                    hintsUsed: hintsUsed || 0,
                    noMistakes: noMistakes || false,
                },
                update: {
                    puzzleType,
                    points,
                    timeSeconds: timeSeconds || 0,
                    hintsUsed: hintsUsed || 0,
                    noMistakes: noMistakes || false,
                },
            });
            syncedCount++;
        }

        res.json({ message: 'Batch sync complete', synced: syncedCount });
    } catch (err) {
        console.error('Batch sync error:', err);
        res.status(500).json({ error: 'Failed to batch sync' });
    }
});

// POST /api/stats/achievements — Save an unlocked achievement permanently
router.post('/achievements', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { achievementId } = req.body;

        if (!achievementId) {
            return res.status(400).json({ error: 'achievementId is required' });
        }

        // Add to the achievements array on UserStats (upsert-safe via push)
        const current = await prisma.userStats.findUnique({ where: { userId } });
        const existing = current?.achievements || [];
        if (!existing.includes(achievementId)) {
            await prisma.userStats.update({
                where: { userId },
                data: { achievements: { push: achievementId } },
            });
        }

        res.json({ message: 'Achievement saved permanently', achievementId });
    } catch (err) {
        console.error('Achievement save error:', err);
        res.status(500).json({ error: 'Failed to save achievement' });
    }
});

export default router;
