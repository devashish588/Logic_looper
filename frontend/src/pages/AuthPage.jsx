import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  setCredentials,
  setLoading,
  setError,
  clearError,
} from '../store/authSlice.js';
import Logo from '../components/Logo.jsx';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Smartphone,
  Chrome,
} from '../components/Icons.jsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const TRUECALLER_APP_KEY = import.meta.env.VITE_TRUECALLER_APP_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleInitialized = useRef(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Handle Truecaller OAuth callback — token arrives as ?token=... from backend redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get('token');
    if (!callbackToken) return;

    // Clean up the URL immediately
    window.history.replaceState({}, '', '/auth');

    (async () => {
      dispatch(setLoading(true));
      dispatch(clearError());
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${callbackToken}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          dispatch(setCredentials({ token: callbackToken, user: data.user }));
        } else {
          dispatch(setError(data.error || 'Session expired. Please log in again.'));
        }
      } catch {
        dispatch(setError('Network error. Could not verify login.'));
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearError());
    setPassword('');
  }, [mode, dispatch]);

  // ── Google Identity Services initialization ──
  const handleGoogleCredential = useCallback(async (response) => {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const result = await res.json();
      if (!res.ok) {
        dispatch(setError(result.error || 'Google login failed'));
        return;
      }
      dispatch(setCredentials({ token: result.token, user: result.user }));
    } catch (err) {
      dispatch(setError('Network error. Is the server running?'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (googleInitialized.current || !GOOGLE_CLIENT_ID) return;
    const initGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleInitialized.current = true;
      }
    };
    // The GIS script might already be loaded or still loading
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      initGoogle();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (typeof window.google !== 'undefined' && window.google.accounts) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);
      // Clean up after 10s if script never loads
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [handleGoogleCredential]);

  function handleGoogleLogin() {
    if (!GOOGLE_CLIENT_ID) {
      dispatch(setError('Google Client ID is not configured'));
      return;
    }
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: render a full Google sign-in button in a temporary div
          const btnDiv = document.createElement('div');
          btnDiv.id = '__g_signin_btn';
          btnDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:white;padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
          document.body.appendChild(btnDiv);
          window.google.accounts.id.renderButton(btnDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: 300,
          });
          // Auto-remove after user picks or 30s
          const cleanup = () => btnDiv.remove();
          btnDiv.addEventListener('click', () => setTimeout(cleanup, 1000));
          setTimeout(cleanup, 30000);
        }
      });
    } else {
      dispatch(setError('Google Sign-In is still loading. Please try again.'));
    }
  }

  // ── Truecaller OAuth redirect ──
  function handleTruecallerLogin() {
    if (!TRUECALLER_APP_KEY) {
      dispatch(setError('Truecaller App Key is not configured'));
      return;
    }
    const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const callbackUrl = `${BACKEND_URL}/api/auth/truecaller/callback`;
    const truecallerAuthUrl =
      `https://oauth.truecaller.com/v1/authorize` +
      `?type=web` +
      `&requestNonce=${encodeURIComponent(nonce)}` +
      `&partnerKey=${encodeURIComponent(TRUECALLER_APP_KEY)}` +
      `&partnerName=LogicLooper` +
      `&redirectUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = truecallerAuthUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(clearError());

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
    const body =
      mode === 'login'
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
    initial: { opacity: 0, x: mode === 'login' ? -20 : 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: mode === 'login' ? 20 : -20 },
  };

  return (
    <div className="auth-page" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="auth-bg-gradient"
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 30%, rgba(10, 196, 224, 0.1), transparent 40%), radial-gradient(circle at 80% 70%, rgba(11, 45, 114, 0.2), transparent 40%)',
          zIndex: 0,
        }}
      />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '420px',
          width: '100%',
          margin: '0 auto',
          padding: '40px',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          className="auth-header"
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <motion.div style={{ marginBottom: '16px', display: 'inline-block' }}>
            <Logo size={48} />
          </motion.div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            Logic Looper
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Professional Daily Logic Training
          </p>
        </div>

        <div
          className="auth-tabs"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '4px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background:
                  mode === m ? 'var(--accent-primary)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {mode === 'register' && (
              <div className="input-group">
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>
            )}
            <div className="input-group">
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </div>
            </div>
            <div className="input-group">
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--accent-danger)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '12px' }}
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Get Started'}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="social-login" style={{ marginTop: '32px' }}>
          <div
            className="divider"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: 'var(--border-color)',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Social Login
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: 'var(--border-color)',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                gap: '12px',
                background: '#fff',
                color: '#000',
              }}
              onClick={handleGoogleLogin}
            >
              <Chrome size={20} /> Continue with Google
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                gap: '12px',
                background: '#0087FF',
                color: '#fff',
                borderColor: '#0087FF',
              }}
              onClick={handleTruecallerLogin}
            >
              <Smartphone size={20} /> Verify with Truecaller
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button
                onClick={() => setMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
