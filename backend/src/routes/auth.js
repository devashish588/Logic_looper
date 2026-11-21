import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = express.Router();

const SALT_ROUNDS = 10;
// Long-lived so daily players aren't silently signed out mid-streak; the client
// re-prompts for login on 401 without touching local progress.
const TOKEN_EXPIRY = '30d';

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
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');
        const displayName = String(req.body?.displayName || '').trim().slice(0, 40);

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Hash password & create user
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                displayName: displayName || email.split('@')[0],
                type: 'registered',
            },
        });

        // Create accompanying UserStats
        await prisma.userStats.create({ data: { userId: user.id } });

        const token = generateToken(user);
        res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Accounts created before emails were normalized may be stored mixed-case.
        const user = await prisma.user.findUnique({ where: { email } })
            ?? await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
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
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/me — get current user from token
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: sanitizeUser(user) });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// POST /api/auth/google — Google Sign-In (verify ID token from frontend)
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ error: 'Google Sign-In is not configured on the server' });
        }

        // Verify the Google ID token
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(clientId);
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
        } catch (err) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const payload = ticket.getPayload();
        const email = String(payload.email).trim().toLowerCase();
        const name = payload.name || email.split('@')[0];
        const avatarUrl = payload.picture || null;

        // Find or create user
        // Case-insensitive, like password login, so one person never ends up with two accounts
        let user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    displayName: name,
                    avatarUrl,
                    type: 'google',
                },
            });
            await prisma.userStats.create({ data: { userId: user.id } });
        } else {
            // Update avatar & name if changed
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    displayName: user.displayName || name,
                    avatarUrl: avatarUrl || user.avatarUrl,
                    type: user.type === 'registered' ? user.type : 'google',
                },
            });
        }

        const token = generateToken(user);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
    }
});

export default router;
