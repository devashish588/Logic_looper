import { z } from 'zod';

export const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: result.error.errors.map(e => ({ path: e.path, message: e.message }))
        });
    }
    next();
};

export const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: result.error.errors.map(e => ({ path: e.path, message: e.message }))
        });
    }
    next();
};
