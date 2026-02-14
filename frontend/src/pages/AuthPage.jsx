import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCredentials, setLoading, setError, clearError } from '../store/authSlice.js';
import Logo from '../components/Logo.jsx';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertTriangle,
} from '../components/Icons.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthPage() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector(state => state.auth);

    // If already authenticated, redirect to home
    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    // Clear error when switching modes
    useEffect(() => {
        dispatch(clearError());
        setPassword('');
    }, [mode, dispatch]);

    async function handleSubmit(e) {
        e.preventDefault();
        dispatch(setLoading(true));
        dispatch(clearError());

        const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
        const body = mode === 'login'
            ? { email, password }
            : { email, password, displayName: displayName || undefined };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                dispatch(setError(data.error || 'Something went wrong'));
                return;
            }

            dispatch(setCredentials({ token: data.token, user: data.user }));
        } catch (err) {
            dispatch(setError('Network error. Is the server running?'));
        }
    }

    const formVariants = {
        initial: { opacity: 0, x: mode === 'login' ? -30 : 30 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: mode === 'login' ? 30 : -30 },
    };

    return (
        <div className="auth-page">
            {/* Floating orbs background */}
            <div className="auth-bg-orb auth-bg-orb-1" />
            <div className="auth-bg-orb auth-bg-orb-2" />
            <div className="auth-bg-orb auth-bg-orb-3" />

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* Logo */}
                <div className="auth-logo">
                    <motion.span
                        className="auth-logo-icon"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Logo size={36} />
                    </motion.span>
                    <span className="auth-logo-text">Logic Looper</span>
                </div>

                <p className="auth-subtitle">Train your logic. One puzzle a day.</p>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => setMode('login')}
                        type="button"
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => setMode('register')}
                        type="button"
                    >
                        Create Account
                    </button>
                    <motion.div
                        className="auth-tab-indicator"
                        animate={{ x: mode === 'login' ? '0%' : '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="auth-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <span className="auth-error-icon">
                                <AlertTriangle size={16} strokeWidth={1.5} />
                            </span>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <AnimatePresence mode="wait">
                    <motion.form
                        key={mode}
                        className="auth-form"
                        onSubmit={handleSubmit}
                        variants={formVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.25 }}
                    >
                        {mode === 'register' && (
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="auth-name">
                                    Display Name
                                </label>
                                <div className="auth-input-wrap">
                                    <span className="auth-input-icon">
                                        <User size={16} strokeWidth={1.5} />
                                    </span>
                                    <input
                                        id="auth-name"
                                        className="auth-input"
                                        type="text"
                                        placeholder="Your name"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="auth-email">
                                Email
                            </label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">
                                    <Mail size={16} strokeWidth={1.5} />
                                </span>
                                <input
                                    id="auth-email"
                                    className="auth-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="auth-password">
                                Password
                            </label>
                            <div className="auth-input-wrap">
                                <span className="auth-input-icon">
                                    <Lock size={16} strokeWidth={1.5} />
                                </span>
                                <input
                                    id="auth-password"
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Your password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-password"
                                    onClick={() => setShowPassword(p => !p)}
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword
                                        ? <EyeOff size={16} strokeWidth={1.5} />
                                        : <Eye size={16} strokeWidth={1.5} />
                                    }
                                </button>
                            </div>
                        </div>

                        <motion.button
                            className="btn btn-primary btn-lg auth-submit"
                            type="submit"
                            disabled={loading}
                            whileTap={{ scale: 0.97 }}
                        >
                            {loading ? (
                                <span className="auth-spinner" />
                            ) : mode === 'login' ? (
                                'Sign In'
                            ) : (
                                'Create Account'
                            )}
                        </motion.button>
                    </motion.form>
                </AnimatePresence>

                {/* Footer */}
                <div className="auth-footer">
                    {mode === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button className="auth-link" onClick={() => setMode('register')} type="button">
                                Create one
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button className="auth-link" onClick={() => setMode('login')} type="button">
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
