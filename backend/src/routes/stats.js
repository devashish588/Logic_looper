import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Aggregate stats from DailyScore history — single source of truth.
 * Recomputes totals, streaks, fastest solve, and heatmap from raw daily records.
 */
async function aggregateStats(userId) {
    const dailyScores = await prisma.dailyScore.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
    });

    if (dailyScores.length === 0) {
        return {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            totalSolved: 0,
            totalPoints: 0,
            averageTime: 0,
            fastestSolve: null,
            lastSolveDate: null,
            solvedTypes: [],
            achievements: [],
            heatmapData: {},
            perfectStreak: 0,
        };
    }

    const totalSolved = dailyScores.length;
    let totalPoints = 0;
    let totalTime = 0;
    let fastestSolve = null;
    const solvedTypesSet = new Set();
    const heatmapData = {};
    let perfectStreak = 0;
    let maxPerfectStreak = 0;

    for (const s of dailyScores) {
        totalPoints += s.points;
        totalTime += s.timeSeconds || 0;
        if (s.puzzleType) solvedTypesSet.add(s.puzzleType);
        heatmapData[s.date] = (heatmapData[s.date] || 0) + s.points;

        if (fastestSolve === null || (s.timeSeconds > 0 && s.timeSeconds < fastestSolve)) {
            fastestSolve = s.timeSeconds;
        }

        if (s.noMistakes) {
            perfectStreak++;
            maxPerfectStreak = Math.max(maxPerfectStreak, perfectStreak);
        } else {
            perfectStreak = 0;
        }
    }

    const averageTime = totalSolved > 0 ? Math.round(totalTime / totalSolved) : 0;
    const lastSolveDate = dailyScores[dailyScores.length - 1].date;

    // Calculate streaks from sorted dates
    const sortedDates = dailyScores.map(s => s.date).sort();
    let longestStreak = 1;
    let runLength = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            runLength++;
            longestStreak = Math.max(longestStreak, runLength);
        } else if (diffDays > 1) {
            runLength = 1;
        }
    }

    // Current streak: walk backward from today
    const today = new Date().toISOString().split('T')[0];
    const dateSet = new Set(sortedDates);
    let currentStreak = 0;
    let checkDate = new Date(today);

    if (!dateSet.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dateSet.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Check achievements
    const achievements = [];
    const unlock = (id) => { if (!achievements.includes(id)) achievements.push(id); };
    if (totalSolved >= 1) unlock('first_solve');
    if (currentStreak >= 3) unlock('streak_3');
    if (currentStreak >= 7) unlock('streak_7');
    if (currentStreak >= 30) unlock('streak_30');
    if (solvedTypesSet.size >= 5) unlock('all_types');
    if (maxPerfectStreak >= 10) unlock('perfect_10');
    if (fastestSolve !== null && fastestSolve < 60) unlock('speed_demon');

    return {
        userId,
        currentStreak,
        longestStreak,
        totalSolved,
        totalPoints,
        averageTime,
        fastestSolve,
        lastSolveDate,
        solvedTypes: Array.from(solvedTypesSet),
        achievements,
        heatmapData,
        perfectStreak: maxPerfectStreak,
    };
}

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

// GET /api/stats/:userId — Aggregated stats from DailyScore history (authenticated)
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        if (userId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const aggregated = await aggregateStats(userId);
        res.json(aggregated);
    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * Calculate final score with hint penalty.
 * Each hint reduces the score multiplier by 0.1x (min 0.5x).
 */
function calculateFinalScore(basePoints, hintsUsed, timeSeconds) {
    const hintMultiplier = Math.max(0.5, 1 - (hintsUsed || 0) * 0.1);
    const timePenalty = Math.floor((timeSeconds || 0) / 60) * 5;
    return Math.max(10, Math.round(basePoints * hintMultiplier - timePenalty));
}

// POST /api/stats/daily — Record a daily solve (authenticated)
router.post('/daily', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date, puzzleType, points, timeSeconds, hintsUsed, noMistakes } = req.body;

        if (!date || !puzzleType || points === undefined) {
            return res.status(400).json({ error: 'date, puzzleType, and points are required' });
        }

        // Apply hint penalty to points
        const adjustedPoints = calculateFinalScore(points, hintsUsed, timeSeconds);

        await prisma.dailyScore.upsert({
            where: { userId_date: { userId, date } },
            create: {
                userId, date, puzzleType, points: adjustedPoints,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            },
            update: {
                puzzleType, points: adjustedPoints,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            },
        });

        // Return freshly aggregated stats so frontend stays in sync
        const aggregated = await aggregateStats(userId);
        res.json({ message: 'Daily score recorded', date, points: adjustedPoints, hintsUsed: hintsUsed || 0, stats: aggregated });
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

        for (const entry of entries) {
            const { date, puzzleType, points, timeSeconds, hintsUsed, noMistakes } = entry;
            if (!date || !puzzleType || points === undefined) continue;

            await prisma.dailyScore.upsert({
                where: { userId_date: { userId, date } },
                create: {
                    userId, date, puzzleType, points,
                    timeSeconds: timeSeconds || 0,
                    hintsUsed: hintsUsed || 0,
                    noMistakes: noMistakes || false,
                },
                update: {
                    puzzleType, points,
                    timeSeconds: timeSeconds || 0,
                    hintsUsed: hintsUsed || 0,
                    noMistakes: noMistakes || false,
                },
            });
            syncedCount++;
        }

        // Return aggregated stats after batch sync
        const aggregated = await aggregateStats(userId);
        res.json({ message: 'Batch sync complete', synced: syncedCount, stats: aggregated });
    } catch (err) {
        console.error('Batch sync error:', err);
        res.status(500).json({ error: 'Failed to batch sync' });
    }
});

export default router;
