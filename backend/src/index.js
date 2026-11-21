import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import leaderboardRoutes from './routes/leaderboard.js';
import authRoutes from './routes/auth.js';

// Load .env from the backend directory (works both locally and on Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Without these the server starts but every login/register fails with a 500, so say so loudly.
// Locally we stop; on Vercel we log and keep going so the error shows up in the function logs.
for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[key]) {
        console.error(`Missing required environment variable ${key} (see backend/.env.example).`);
        if (process.env.VERCEL !== '1') process.exit(1);
    }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS_ORIGIN may be a comma-separated list (e.g. production + preview URLs)
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.4.0',
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(`Server error on ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
});

// Only start the server when running directly (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🧠 Logic Looper API running on http://localhost:${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

export default app;
