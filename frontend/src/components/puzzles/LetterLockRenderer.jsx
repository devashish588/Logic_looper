import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    scoreGuess, keyboardStatus, WORD_LENGTH, isAllowedWord,
} from '../../engine/types/letterLock.js';

// '*' = Enter, '<' = Backspace
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '*zxcvbnm<'];
const REVEAL_STEP_MS = 140;

const STATE_LABEL = { correct: 'right letter, right spot', present: 'in the word, wrong spot', absent: 'not in the word' };

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Guesses survive leaving the page and coming back (same tab session), keyed by puzzle and attempt.
const storageKey = (puzzle, attempt) => `ll-letterlock:${puzzle.id}:${attempt}`;

function restoreGuesses(puzzle, attempt) {
    try {
        const raw = JSON.parse(sessionStorage.getItem(storageKey(puzzle, attempt)) || '[]');
        if (!Array.isArray(raw)) return [];
        const ok = raw.filter(w => typeof w === 'string' && /^[a-z]{5}$/.test(w) && isAllowedWord(w));
        // A saved board that already contains the answer (or is full) is finished: start fresh.
        if (ok.includes(puzzle.answer) || ok.length >= puzzle.maxGuesses) return [];
        return ok;
    } catch {
        return [];
    }
}

export default function LetterLockRenderer({ puzzle, onAnswer, onFail, attempt = 0 }) {
    const { answer, maxGuesses } = puzzle;

    const [guesses, setGuesses] = useState(() => restoreGuesses(puzzle, attempt));
    const [current, setCurrent] = useState('');
    const [toast, setToast] = useState(null);
    const [shake, setShake] = useState(false);
    const [animRow, setAnimRow] = useState(-1); // row currently flipping over
    const [busy, setBusy] = useState(false);    // reveal in progress: ignore input
    const timers = useRef([]);
    const rowRefs = useRef([]);
    const prevAttempt = useRef(attempt);

    const solved = guesses.includes(answer);
    const locked = busy || solved;

    const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    // A failed board bumps `attempt` (the parent counts mistakes): start a fresh board.
    useEffect(() => {
        if (prevAttempt.current === attempt) return;
        prevAttempt.current = attempt;
        setGuesses([]);
        setCurrent('');
        setBusy(false);
        setAnimRow(-1);
    }, [attempt]);

    // Tell the parent about guesses restored from this session (for hints).
    useEffect(() => {
        if (guesses.length) onAnswer({ guesses });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try { sessionStorage.setItem(storageKey(puzzle, attempt), JSON.stringify(guesses)); } catch { /* private mode */ }
    }, [guesses, puzzle, attempt]);

    // Keep the row being filled in view above the pinned keyboard (phones).
    useEffect(() => {
        const row = rowRefs.current[Math.min(guesses.length, maxGuesses - 1)];
        row?.scrollIntoView?.({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, [guesses.length, maxGuesses]);

    const flash = useCallback((message) => {
        setToast(message);
        setShake(true);
        later(() => setShake(false), 450);
        later(() => setToast(null), 1500);
    }, []);

    const addLetter = useCallback((ch) => {
        if (locked || guesses.length >= maxGuesses) return;
        setCurrent(c => (c.length < WORD_LENGTH ? c + ch : c));
    }, [locked, guesses.length, maxGuesses]);

    const backspace = useCallback(() => {
        if (locked) return;
        setCurrent(c => c.slice(0, -1));
    }, [locked]);

    const submit = useCallback(() => {
        if (locked || guesses.length >= maxGuesses) return;
        if (current.length < WORD_LENGTH) return flash('Not enough letters');
        if (!isAllowedWord(current)) return flash('Not in word list');
        if (guesses.includes(current)) return flash('Already guessed');

        const word = current;
        const next = [...guesses, word];
        const delay = prefersReducedMotion() ? 0 : (WORD_LENGTH - 1) * REVEAL_STEP_MS + 450;
        setGuesses(next);
        setCurrent('');
        setAnimRow(delay ? next.length - 1 : -1);
        setBusy(true);

        // Let the player see the colours before the game reacts (win screen / out of guesses).
        later(() => {
            setBusy(false);
            setAnimRow(-1);
            if (word !== answer && next.length >= maxGuesses) onFail?.();
            else onAnswer({ guesses: next });
        }, delay);
    }, [locked, guesses, current, maxGuesses, answer, flash, onAnswer, onFail]);

    // Physical keyboard
    useEffect(() => {
        const onKey = (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key === 'Enter') {
                // A focused button (e.g. Hint, via keyboard) keeps its normal Enter behaviour.
                if (document.activeElement?.tagName === 'BUTTON') return;
                e.preventDefault();
                submit();
            } else if (e.key === 'Backspace') {
                backspace();
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                addLetter(e.key.toLowerCase());
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [submit, backspace, addLetter]);

    // The keyboard only learns from a row once it has finished flipping.
    const revealed = animRow >= 0 ? guesses.slice(0, guesses.length - 1) : guesses;
    const keys = keyboardStatus(revealed, answer);
    const turn = Math.min(guesses.length + 1, maxGuesses);

    return (
        <div className="puzzle-area ll-area">
            <div className="game-status">
                <span>Guess <strong>{turn}</strong> of {maxGuesses}</span>
            </div>

            <div className="ll-toast-wrap" aria-live="polite">
                {toast && <div className="ll-toast">{toast}</div>}
            </div>

            <div className="ll-board" role="grid" aria-label="Guesses">
                {Array.from({ length: maxGuesses }, (_, r) => {
                    const submitted = r < guesses.length;
                    const word = submitted ? guesses[r] : r === guesses.length ? current : '';
                    const marks = submitted ? scoreGuess(word, answer) : null;
                    return (
                        <div
                            key={r}
                            ref={(el) => { rowRefs.current[r] = el; }}
                            role="row"
                            className={`ll-row ${r === animRow ? 'reveal' : ''} ${r === guesses.length && shake ? 'shake' : ''}`}
                        >
                            {Array.from({ length: WORD_LENGTH }, (_, c) => {
                                const letter = word[c] || '';
                                const state = marks ? marks[c] : letter ? 'typed' : 'empty';
                                return (
                                    <div
                                        key={c}
                                        role="gridcell"
                                        className={`ll-tile ${state}`}
                                        style={{ '--i': c }}
                                        aria-label={letter ? `${letter}, ${STATE_LABEL[state] || 'typed'}` : 'empty'}
                                    >
                                        {letter.toUpperCase()}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <div className="ll-keyboard" aria-label="On-screen keyboard">
                {KEY_ROWS.map((row, i) => (
                    <div key={i} className="ll-key-row">
                        {[...row].map(k => {
                            const isEnter = k === '*';
                            const isBack = k === '<';
                            const status = !isEnter && !isBack ? keys[k] : null;
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    className={`ll-key ${isEnter || isBack ? 'wide' : ''} ${status || ''}`}
                                    aria-label={isEnter ? 'Enter' : isBack ? 'Backspace' : `${k}${status ? `, ${STATE_LABEL[status]}` : ''}`}
                                    // Keep focus where it is, so a later physical Enter isn't swallowed by this button.
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => (isEnter ? submit() : isBack ? backspace() : addLetter(k))}
                                >
                                    {isEnter ? 'Enter' : isBack ? '⌫' : k.toUpperCase()}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <p className="text-muted mt-16" style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 420 }}>
                Type a five-letter word and press Enter. <strong style={{ color: 'var(--ll-correct)' }}>Green</strong>: right
                letter, right spot. <strong style={{ color: 'var(--ll-present)' }}>Yellow</strong>: in the word, wrong spot.
                <strong> Grey</strong>: not in the word. Run out of guesses and you get a fresh board (−10 points).
            </p>
        </div>
    );
}
