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

const API_URL = import.meta.env.VITE_API_URL || '/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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

    // Google Sign-In
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        // Load GSI script
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGSI;
            document.head.appendChild(script);
        } else if (window.google?.accounts) {
            initializeGSI();
        }
    }, []);

    function initializeGSI() {
        if (!window.google?.accounts) return;
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });
    }

    async function handleGoogleResponse(response) {
        if (!response.credential) return;
        dispatch(setLoading(true));
        dispatch(clearError());

        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await res.json();
            if (!res.ok) {
                dispatch(setError(data.error || 'Google sign-in failed'));
                return;
            }

            dispatch(setCredentials({ token: data.token, user: data.user }));
        } catch (err) {
            dispatch(setError('Network error. Is the server running?'));
        }
    }

    function handleGoogleClick() {
        if (!GOOGLE_CLIENT_ID) {
            dispatch(setError('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env'));
            return;
        }
        if (window.google?.accounts) {
            window.google.accounts.id.prompt();
        } else {
            dispatch(setError('Google Sign-In is loading. Please try again in a moment.'));
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

                {/* Google Divider + Button */}
                <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                </div>

                <motion.button
                    type="button"
                    className="btn btn-google"
                    onClick={handleGoogleClick}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '10px', flexShrink: 0 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                </motion.button>

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
