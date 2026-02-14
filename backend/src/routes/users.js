import express from 'express';

const router = express.Router();

// POST /api/users/guest — Create or retrieve guest user
router.post('/guest', (req, res) => {
    const guestId = crypto.randomUUID();
    res.json({
        id: guestId,
        type: 'guest',
        createdAt: new Date().toISOString(),
    });
});

// GET /api/users/:id — Get user profile
router.get('/:id', (req, res) => {
    res.json({
        id: req.params.id,
        type: 'guest',
        displayName: `Player_${req.params.id.slice(0, 6)}`,
        createdAt: new Date().toISOString(),
    });
});

// POST /api/users/auth/google — Google OAuth (stub)
router.post('/auth/google', (req, res) => {
    res.status(501).json({
        message: 'Google OAuth not yet implemented',
        status: 'coming_soon',
    });
});

// POST /api/users/auth/truecaller — Truecaller (stub)
router.post('/auth/truecaller', (req, res) => {
    res.status(501).json({
        message: 'Truecaller auth not yet implemented',
        status: 'coming_soon',
    });
});

export default router;
