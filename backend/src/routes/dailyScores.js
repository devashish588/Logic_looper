import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/daily-scores — Record a solve immediately (idempotent upsert)
router.post('/', authenticateToken, async (req, res) => {
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

        // Upsert to handle "Unique Constraint" issues if user solves twice
        const result = await prisma.dailyScore.upsert({
            where: {
                userId_date: { userId, date }
            },
            update: {
                puzzleType,
                points,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            },
            create: {
                userId,
                date,
                puzzleType,
                points,
                timeSeconds: timeSeconds || 0,
                hintsUsed: hintsUsed || 0,
                noMistakes: noMistakes || false,
            }
        });

        res.json({ message: 'Daily score persisted', data: result });
    } catch (err) {
        console.error('Daily score persistence error:', err);
        res.status(500).json({ error: 'Failed to persist daily score' });
    }
});

export default router;
