// Vercel Serverless Function entry point (.mjs forces ESM mode)
// Wraps the Express app for Vercel's serverless runtime
import app from '../backend/src/index.js';

export default app;
