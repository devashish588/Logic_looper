import express from 'express';

const router = express.Router();

// Mock leaderboard data
const mockLeaderboard = [
    { rank: 1, displayName: 'BrainMaster', points: 2450, streak: 28 },
    { rank: 2, displayName: 'LogicKing', points: 2100, streak: 21 },
    { rank: 3, displayName: 'PuzzleQueen', points: 1890, streak: 19 },
    { rank: 4, displayName: 'MindBender', points: 1750, streak: 17 },
    { rank: 5, displayName: 'ThinkTank', points: 1620, streak: 15 },
    { rank: 6, displayName: 'NeuralNinja', points: 1500, streak: 14 },
    { rank: 7, displayName: 'CortexCrush', points: 1380, streak: 12 },
    { rank: 8, displayName: 'SynapseStorm', points: 1200, streak: 10 },
    { rank: 9, displayName: 'DendriteDash', points: 1050, streak: 8 },
    { rank: 10, displayName: 'AxonAce', points: 900, streak: 7 },
];

// GET /api/leaderboard — Get top players
router.get('/', (req, res) => {
    const { period = 'alltime', limit = 100 } = req.query;

    // TODO: Fetch from database, filter by period
    res.json({
        period,
        entries: mockLeaderboard.slice(0, Math.min(parseInt(limit), 100)),
        updatedAt: new Date().toISOString(),
    });
});

// GET /api/leaderboard/daily — Today's leaderboard
router.get('/daily', (req, res) => {
    res.json({
        period: 'today',
        date: new Date().toISOString().split('T')[0],
        entries: mockLeaderboard.slice(0, 5).map((entry, i) => ({
            ...entry,
            rank: i + 1,
            points: Math.floor(entry.points * 0.1),
        })),
        updatedAt: new Date().toISOString(),
    });
});

export default router;
