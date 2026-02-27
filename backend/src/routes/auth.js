import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        type: user.type,
        createdAt: user.createdAt,
    };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                displayName: displayName || email.split('@')[0],
                type: 'registered',
            },
        });
        await prisma.userStats.create({ data: { userId: user.id } });
        const token = generateToken(user);
        res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = generateToken(user);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'ID Token is required' });

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        const user = await prisma.user.upsert({
            where: { googleId },
            update: {
                displayName: name,
                avatarUrl: picture,
                type: 'google',
            },
            create: {
                googleId,
                email,
                displayName: name,
                avatarUrl: picture,
                type: 'google',
            },
        });

        await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        });

        const token = generateToken(user);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

// POST /api/auth/truecaller
router.post('/truecaller', async (req, res) => {
    try {
        const { truecallerId, email, name, avatarUrl } = req.body;
        if (!truecallerId) return res.status(400).json({ error: 'Truecaller ID is required' });

        const user = await prisma.user.upsert({
            where: { truecallerId },
            update: {
                displayName: name,
                avatarUrl,
                type: 'truecaller',
            },
            create: {
                truecallerId,
                email,
                displayName: name,
                avatarUrl,
                type: 'truecaller',
            },
        });

        await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        });

        const token = generateToken(user);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Truecaller login error:', err);
        res.status(500).json({ error: 'Truecaller authentication failed' });
    }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
    try {
        const guestId = Math.random().toString(36).substring(2, 8);
        const displayName = `Guest_${guestId}`;
        const user = await prisma.user.create({
            data: {
                displayName,
                type: 'guest',
            },
        });
        await prisma.userStats.create({ data: { userId: user.id } });
        const token = generateToken(user);
        res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Guest login error:', err);
        res.status(500).json({ error: 'Failed to create guest account' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user: sanitizeUser(user) });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

// GET /api/auth/truecaller/callback
// Truecaller OAuth redirects back here via GET with an access token in query params
router.get('/truecaller/callback', async (req, res) => {
    try {
        const { accessToken, requestId, endpoint } = req.query;

        if (!accessToken) {
            return res.status(400).json({ error: 'Missing Truecaller access token' });
        }

        // Exchange accessToken with Truecaller profile endpoint
        const profileRes = await fetch(
            endpoint || 'https://profile4.truecaller.com/v1/default',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Requested-With': 'com.truecaller.android.sdk.truecaller',
                },
            }
        );

        if (!profileRes.ok) {
            return res.status(502).json({ error: 'Truecaller profile fetch failed' });
        }

        const profile = await profileRes.json();
        const truecallerId = profile.userId || profile.phoneNumberObj?.e164 || requestId;
        const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        const email = profile.email || null;
        const avatarUrl = profile.avatarUrl || null;

        if (!truecallerId) {
            return res.status(400).json({ error: 'Unable to resolve Truecaller identity' });
        }

        const user = await prisma.user.upsert({
            where: { truecallerId },
            update: { displayName: name, avatarUrl, type: 'truecaller' },
            create: { truecallerId, email, displayName: name, avatarUrl, type: 'truecaller' },
        });

        await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        });

        const token = generateToken(user);

        // Redirect back to frontend with token in query string (SPA handles it)
        const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth?token=${token}`);
    } catch (err) {
        console.error('Truecaller callback error:', err);
        res.status(500).json({ error: 'Truecaller callback failed' });
    }
});

export default router;
