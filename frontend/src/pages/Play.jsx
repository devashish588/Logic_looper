import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import {
    generatePuzzle, generatePuzzleOfType, checkPuzzle, difficultyLabel, FREE_PLAY_LEVELS,
    getTodayDateString, getPuzzleTypeForDate,
} from '../engine/generator.js';
import { buildHint, hasAnyAnswer, computeRevealHint, REVEAL_HINT_TYPES } from '../engine/hints.js';
import {
    PUZZLE_TYPES, PUZZLE_LABELS, PUZZLE_DESCRIPTIONS, PUZZLE_RULES, MAX_HINTS, ACHIEVEMENTS,
    DIFFICULTY_LEVELS, HINT_ALLOWANCE, computePoints,
} from '../utils/constants.js';
import {
    loadPuzzle, updateAnswer, useHint, addHintedCell, tickTimer, markSolved, markFailed, retry,
} from '../store/gameSlice.js';
import { recordSolve, setSyncStatus } from '../store/statsSlice.js';
import { saveDailyActivity } from '../storage/activityStore.js';
import { savePracticeResult } from '../storage/db.js';
import { syncDailyActivity } from '../utils/syncManager.js';
import { buildShareText, resultSquares, formatClock, puzzleNumber } from '../utils/share.js';
import NumberMatrixRenderer from '../components/puzzles/NumberMatrixRenderer.jsx';
import SequenceSolverRenderer from '../components/puzzles/SequenceSolverRenderer.jsx';
import DeductionGridRenderer from '../components/puzzles/DeductionGridRenderer.jsx';
import BinaryLogicRenderer from '../components/puzzles/BinaryLogicRenderer.jsx';
import SwitchboardRenderer from '../components/puzzles/SwitchboardRenderer.jsx';
import LaserPathRenderer from '../components/puzzles/LaserPathRenderer.jsx';
import MeasureUpRenderer from '../components/puzzles/MeasureUpRenderer.jsx';
import BalanceScaleRenderer from '../components/puzzles/BalanceScaleRenderer.jsx';
import PixelLogicRenderer from '../components/puzzles/PixelLogicRenderer.jsx';
import NumberTrailRenderer from '../components/puzzles/NumberTrailRenderer.jsx';
import LetterLockRenderer from '../components/puzzles/LetterLockRenderer.jsx';
import NextPuzzleCountdown from '../components/NextPuzzleCountdown.jsx';
import {
    PuzzleIcon,
    Clock,
    Lightbulb,
    CheckCircle,
    AlertTriangle,
    RotateCcw,
    BarChart3,
    ArrowLeft,
    Info,
    Flame,
    Share2,
    Snowflake,
    CalendarDays,
    Dices,
    AchievementIcon,
} from '../components/Icons.jsx';

/** How far back the archive goes. */
export const ARCHIVE_DAYS = 365;

/** A past date the archive allows, or null. */
export function validPracticeDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
    const d = dayjs(date);
    const today = dayjs().startOf('day');
    if (!d.isValid() || d.format('YYYY-MM-DD') !== date) return null;
    if (!d.isBefore(today) || today.diff(d, 'day') > ARCHIVE_DAYS) return null;
    return date;
}

// Practice replays use the middle level; Free Play's levels map onto the same three names, so hints
// and badges read the same everywhere.
const PRACTICE_DIFFICULTY = 'intermediate';
const FREE_LEVEL_TO_DIFFICULTY = { easy: 'novice', medium: 'intermediate', hard: 'expert' };
const DIFFICULTY_LABEL = Object.fromEntries(DIFFICULTY_LEVELS.map(l => [l.key, l.label]));

function Confetti() {
    const pieces = useMemo(() => {
        const colors = ['#8B5CF6', '#6366F1', '#A78BFA', '#F59E0B', '#10B981', '#EF4444', '#C4B5FD'];
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 1.5,
            size: 6 + Math.random() * 8,
        }));
    }, []);

    return (
        <>
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        background: p.color,
                        width: p.size,
                        height: p.size,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </>
    );
}

function HowToPlay({ puzzleType }) {
    const [open, setOpen] = useState(false);
    const rules = PUZZLE_RULES[puzzleType];
    if (!rules) return null;

    return (
        <motion.div
            className="card"
            style={{ marginBottom: '16px', padding: '14px 16px', cursor: 'pointer' }}
            onClick={() => setOpen(!open)}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={16} strokeWidth={1.5} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>How to Play</span>
                </div>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}
                >
                    ▼
                </motion.span>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingTop: '12px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Rules
                                </div>
                                {rules.rules.map((r, i) => (
                                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', gap: '6px' }}>
                                        <span style={{ color: 'var(--accent-primary)' }}>•</span> {r}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--accent-success)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pro Tips
                                </div>
                                {rules.tips.map((t, i) => (
                                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', gap: '6px' }}>
                                        <span style={{ color: 'var(--accent-success)' }}>★</span> {t}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/** The share grid, drawn as squares (the shared text uses emoji). */
export function ResultSquares({ hintsUsed, mistakes }) {
    const labels = { hint: 'hint', miss: 'wrong submission', solve: 'solved' };
    return (
        <div className="result-squares" aria-label={`${hintsUsed} hints, ${mistakes} wrong submissions, solved`}>
            {resultSquares({ hintsUsed, mistakes }).map((kind, i) => (
                <span key={i} className={`result-square ${kind}`} title={labels[kind]} />
            ))}
        </div>
    );
}

export function ShareButton({ text, className = 'btn btn-secondary' }) {
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        try {
            if (navigator.share) {
                await navigator.share({ text });
                return;
            }
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* user cancelled the share sheet */
        }
    }

    return (
        <button className={className} onClick={handleShare}>
            <Share2 size={16} strokeWidth={1.5} /> {copied ? 'Copied!' : 'Share'}
        </button>
    );
}

export default function Play() {
    const dispatch = useDispatch();
    const store = useStore();
    const navigate = useNavigate();
    const { date: dateParam, type: typeParam, level: levelParam, seed: seedParam } = useParams();
    const game = useSelector(state => state.game);
    const stats = useSelector(state => state.stats);
    const timerEnabled = useSelector(state => state.settings.timerEnabled);
    const userId = useSelector(state => state.auth.user?.id);
    const timerRef = useRef(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [notice, setNotice] = useState(null);
    const [newBadges, setNewBadges] = useState([]);
    const [shareText, setShareText] = useState(null);
    const [solvedThisVisit, setSolvedThisVisit] = useState(false);
    const [freezeEarned, setFreezeEarned] = useState(false);

    const isFree = typeParam !== undefined;
    const isPractice = dateParam !== undefined;
    const mode = isFree ? 'free' : isPractice ? 'practice' : 'daily';
    const isDaily = mode === 'daily';
    const practiceDate = isPractice ? validPracticeDate(dateParam) : null;
    const freeSpec = isFree && PUZZLE_TYPES.includes(typeParam) && FREE_PLAY_LEVELS[levelParam] !== undefined
        && /^\d{1,9}$/.test(seedParam || '')
        ? { type: typeParam, level: levelParam, seed: Number(seedParam) }
        : null;
    const todayDate = getTodayDateString();
    // Puzzle ids: the date (daily and practice) or free:type:level:seed
    const puzzleId = isFree
        ? (freeSpec ? `free:${freeSpec.type}:${freeSpec.level}:${freeSpec.seed}` : null)
        : isPractice ? practiceDate : todayDate;
    const todaysEntry = stats.history[todayDate];
    const alreadySolved = isDaily && Boolean(todaysEntry);

    // Today's puzzle already started (in the store, or set aside while the player practiced)?
    const dailyInProgress = isDaily && (
        (game.mode === 'daily' && game.currentPuzzle?.id === todayDate)
        || game.dailyStash?.currentPuzzle?.id === todayDate
    );
    // Not started yet: the player picks a difficulty first
    const needsPicker = isDaily && stats.hydrated && !alreadySolved && !dailyInProgress;

    // Open the puzzle, but only once the player's session has finished loading (`hydrated`). Effects
    // run child-first, so on a direct page load or refresh the app-level effect resets the game AFTER
    // this one would have loaded it, leaving a blank "Loading" screen. Waiting for `hydrated`
    // guarantees that reset already happened. (For daily it's also how we know whether today is
    // already solved.) The reducer resumes an in-progress puzzle instead of restarting it, so leaving
    // the page can't reset the timer or hints.
    const ready = Boolean(puzzleId) && stats.hydrated && !alreadySolved && (!isDaily || dailyInProgress);
    useEffect(() => {
        if (!ready) return;
        setNotice(null);
        setSolvedThisVisit(false);
        setNewBadges([]);
        setShareText(null);
        setFreezeEarned(false);
        let puzzle;
        let difficulty = null;
        if (isFree) {
            puzzle = generatePuzzleOfType(freeSpec.type, freeSpec.seed, freeSpec.level);
            difficulty = FREE_LEVEL_TO_DIFFICULTY[freeSpec.level];
        } else {
            puzzle = generatePuzzle(puzzleId);
            if (isPractice) difficulty = PRACTICE_DIFFICULTY;
        }
        dispatch(loadPuzzle({ puzzle, mode, difficulty }));
    }, [userId, puzzleId, mode, ready, dispatch]);

    // Timer
    useEffect(() => {
        if (game.timerRunning) {
            timerRef.current = setInterval(() => dispatch(tickTimer()), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [game.timerRunning, dispatch]);

    const handleSelectDifficulty = (level) => {
        dispatch(loadPuzzle({
            puzzle: generatePuzzle(todayDate, level.modifier),
            mode: 'daily',
            difficulty: level.key,
        }));
    };

    function handleAnswer(answer) {
        setNotice(null);
        const puzzle = game.currentPuzzle;
        dispatch(updateAnswer(answer));
        // Puzzles with live feedback have no Submit button: they finish the moment they're right.
        if (puzzle?.autoCheck && !store.getState().game.solved && checkPuzzle(puzzle, answer)) {
            finishSolve();
        }
    }

    function handleSubmit() {
        const puzzle = game.currentPuzzle;
        if (!puzzle || game.solved) return;

        if (!hasAnyAnswer(puzzle, game.userAnswer)) {
            setNotice('Fill in your answer before submitting.');
            return;
        }

        if (!checkPuzzle(puzzle, game.userAnswer)) {
            dispatch(markFailed());
            return;
        }
        finishSolve();
    }

    // Records a correct solution. Reads the latest game state from the store, so
    // it is safe to call from a renderer's event handler.
    async function finishSolve() {
        const g = store.getState().game;
        const puzzle = g.currentPuzzle;
        if (!puzzle || g.solved) return;

        const timeSeconds = g.timerSeconds;
        const points = computePoints({
            hintsUsed: g.hintsUsed, mistakes: g.mistakes, timeSeconds, puzzleType: puzzle.type,
        });
        dispatch(markSolved({ points }));
        setSolvedThisVisit(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);

        const { auth } = store.getState();

        // Free play never touches stats, history or the leaderboard.
        if (isFree) return;

        // Practice: kept on this device only. No streak, history or leaderboard.
        if (isPractice) {
            savePracticeResult(auth.user?.id, puzzle.date, { points, timeSeconds })
                .catch(err => console.warn('Could not save practice result:', err));
            return;
        }

        // A day counts once. Guards against recording twice (e.g. two tabs).
        if (store.getState().stats.history[todayDate]) return;

        const entry = {
            date: todayDate,
            points,
            puzzleType: puzzle.type,
            timeSeconds,
            hintsUsed: g.hintsUsed,
            mistakes: g.mistakes,
            noMistakes: g.mistakes === 0,
            solvedAt: new Date().toISOString(),
        };

        const before = new Set(store.getState().stats.achievements);
        dispatch(recordSolve(entry));
        const after = store.getState().stats;
        setNewBadges(ACHIEVEMENTS.filter(a => after.achievements.includes(a.id) && !before.has(a.id)));
        setFreezeEarned(after.freezeEarnedDates.includes(todayDate));
        setShareText(buildShareText({ ...entry, streak: after.currentStreak }));

        // Save on the device first (works offline), then back up to the server.
        if (!auth.user?.id) return;
        try {
            await saveDailyActivity(auth.user.id, entry);
        } catch (err) {
            console.error('Could not save solve locally:', err);
        }
        dispatch(setSyncStatus('syncing'));
        dispatch(setSyncStatus(await syncDailyActivity(auth.user.id, auth.token, after.achievements)));
    }

    // Hints are limited per difficulty (novice 3, intermediate 2, expert 1) and cost 10% of the score each.
    const allowance = HINT_ALLOWANCE[game.selectedDifficulty] || MAX_HINTS;
    const hintsLeft = Math.max(0, allowance - game.hintsUsed);

    const handleHint = () => {
        const puzzle = game.currentPuzzle;
        if (!puzzle || hintsLeft <= 0 || game.hintsRemaining <= 0) return;

        // The original games reveal the value right on the board (their renderers highlight it)
        if (REVEAL_HINT_TYPES.has(puzzle.type)) {
            const data = computeRevealHint(puzzle, { userAnswer: game.userAnswer });
            if (data) {
                setNotice(null);
                dispatch(useHint());
                dispatch(addHintedCell(data));
            } else {
                setNotice('There is nothing left to reveal.');
            }
            return;
        }

        // The newer games show a short text hint, and point at the spot on the board
        const hint = buildHint(puzzle, game.hintsUsed, { userAnswer: game.userAnswer });
        if (!hint) {
            setNotice('There is nothing left to reveal.');
            return;
        }
        if (hint.free) {
            setNotice(hint.text);
            return;
        }
        setNotice(null);
        dispatch(useHint(hint));
    };

    if (isPractice && !practiceDate) {
        return <Navigate to="/practice" replace />;
    }
    if (isFree && !freeSpec) {
        return <Navigate to="/free" replace />;
    }

    if (!stats.hydrated) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="text-muted">Loading your progress…</div>
            </div>
        );
    }

    // Already solved today (unless it was solved just now: then the result dialog shows)
    if (alreadySolved && !solvedThisVisit) {
        const todaysShare = buildShareText({ ...todaysEntry, streak: stats.currentStreak });
        return (
            <motion.div
                className="flex-center flex-col"
                style={{ minHeight: '60vh', gap: '16px', textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div style={{ color: 'var(--accent-success)' }}>
                    <CheckCircle size={56} strokeWidth={1.5} />
                </div>
                <h2>Today's Challenge Complete</h2>
                <ResultSquares hintsUsed={todaysEntry.hintsUsed} mistakes={todaysEntry.mistakes} />
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    You scored <strong>{todaysEntry.points}</strong> points
                    {stats.currentStreak > 1 && <> · {stats.currentStreak}-day streak</>}
                </p>
                <NextPuzzleCountdown />
                <div className="flex-center gap-8" style={{ flexWrap: 'wrap' }}>
                    <ShareButton text={todaysShare} className="btn btn-primary" />
                    <button className="btn btn-secondary" onClick={() => navigate('/practice')}>
                        <CalendarDays size={16} strokeWidth={1.5} /> Practice past puzzles
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
                        <BarChart3 size={16} strokeWidth={1.5} /> Today's ranks
                    </button>
                </div>
            </motion.div>
        );
    }

    // Difficulty selection screen (today's puzzle, not started yet)
    if (needsPicker && !solvedThisVisit) {
        const puzzleType = getPuzzleTypeForDate(todayDate);
        return (
            <motion.div
                className="flex-center flex-col"
                style={{ minHeight: '60vh', gap: '20px', padding: '16px 0' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="play-info" style={{ justifyContent: 'center', marginBottom: '4px' }}>
                    <span className="play-info-icon">
                        <PuzzleIcon type={puzzleType} size={32} />
                    </span>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{PUZZLE_LABELS[puzzleType]}</div>
                        <div className="text-muted" style={{ fontSize: '0.82rem' }}>{PUZZLE_DESCRIPTIONS[puzzleType]}</div>
                    </div>
                </div>

                {/* How to Play */}
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <HowToPlay puzzleType={puzzleType} />
                </div>

                <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Choose Difficulty</h2>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: '100%',
                    maxWidth: '400px',
                }}>
                    {DIFFICULTY_LEVELS.map((level, idx) => (
                        <motion.button
                            key={level.key}
                            className="card"
                            onClick={() => handleSelectDifficulty(level)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                textAlign: 'left',
                                padding: '18px 20px',
                                border: '2px solid transparent',
                            }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.08 }}
                            whileHover={{ borderColor: 'var(--accent-primary)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span style={{ fontSize: '1.6rem' }}>
                                {idx === 0 ? '🌱' : idx === 1 ? '⚡' : '🔥'}
                            </span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{level.label}</div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>{level.description}</div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        );
    }

    // Wait until the requested puzzle is the one in the store (avoids a flash of
    // the previous puzzle when switching between days).
    if (!game.currentPuzzle || game.currentPuzzle.id !== puzzleId || game.mode !== mode) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="text-muted">Loading puzzle…</div>
            </div>
        );
    }

    const puzzle = game.currentPuzzle;

    const renderPuzzle = () => {
        // key: remount inputs when the puzzle changes so no answers carry over
        const key = `${mode}-${puzzle.id}`;
        const highlight = game.highlight;
        switch (puzzle.type) {
            case 'numberMatrix':
                return <NumberMatrixRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'sequenceSolver':
                return <SequenceSolverRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'deductionGrid':
                return <DeductionGridRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'binaryLogic':
                return <BinaryLogicRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'switchboard':
                return <SwitchboardRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'laserPath':
                return <LaserPathRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'measureUp':
                return <MeasureUpRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'balanceScale':
                return <BalanceScaleRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'pixelLogic':
                return <PixelLogicRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'numberTrail':
                return <NumberTrailRenderer key={key} puzzle={puzzle} onAnswer={handleAnswer} highlight={highlight} />;
            case 'letterLock':
                return (
                    <LetterLockRenderer
                        key={key}
                        puzzle={puzzle}
                        onAnswer={handleAnswer}
                        onFail={() => dispatch(markFailed())}
                        attempt={game.mistakes}
                    />
                );
            default:
                return <div>Unknown puzzle type</div>;
        }
    };

    const difficultyBadge = DIFFICULTY_LABEL[game.selectedDifficulty] || difficultyLabel(puzzle.difficulty);

    return (
        <div>
            {showConfetti && <Confetti />}

            {isFree && (
                <div className="practice-banner">
                    <span>
                        <strong>Free play</strong> · Unlimited puzzles. Doesn't affect your streak or the leaderboard.
                    </span>
                    <Link to="/free" className="practice-banner-link">
                        <ArrowLeft size={14} strokeWidth={1.5} /> All games
                    </Link>
                </div>
            )}

            {isPractice && (
                <div className="practice-banner">
                    <span>
                        <strong>Practice</strong> · Puzzle #{puzzleNumber(puzzle.date)} from {dayjs(puzzle.date).format('MMM D, YYYY')}.
                        Doesn't affect your streak or the leaderboard.
                    </span>
                    <Link to="/practice" className="practice-banner-link">
                        <ArrowLeft size={14} strokeWidth={1.5} /> Archive
                    </Link>
                </div>
            )}

            {/* Floating status bar */}
            <div className="play-header">
                <div className="play-info">
                    <span className="play-info-icon">
                        <PuzzleIcon type={puzzle.type} size={22} />
                    </span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{PUZZLE_LABELS[puzzle.type]}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {isFree ? `Free play · puzzle ${puzzle.seed}` : `#${puzzleNumber(puzzle.date)} · ${puzzle.date}`}
                        </div>
                    </div>
                    <span className="badge badge-difficulty">{difficultyBadge}</span>
                </div>
                <div className="play-actions">
                    {timerEnabled && (
                        <div className="timer-bar">
                            <span className="timer-icon"><Clock size={14} strokeWidth={1.5} /></span>
                            {formatClock(game.timerSeconds)}
                        </div>
                    )}
                    {game.mistakes > 0 && (
                        <span className="badge" title="Each wrong submission costs 10 points">
                            {game.mistakes} mistake{game.mistakes === 1 ? '' : 's'}
                        </span>
                    )}
                </div>
            </div>

            {/* How to Play accordion */}
            <HowToPlay puzzleType={puzzle.type} />

            {/* Revealed text hints (the newer games) */}
            {game.hints.length > 0 && (
                <div className="hint-list" aria-live="polite">
                    {game.hints.map((text, i) => (
                        <div key={i} className="hint-item">
                            <Lightbulb size={16} strokeWidth={1.5} />
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Puzzle Area */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                {renderPuzzle()}
            </motion.div>

            {notice && <p className="play-notice" role="status">{notice}</p>}

            {/* Action Buttons */}
            {!game.showResult && (
                <motion.div
                    className="flex-center gap-8 mt-24"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                            handleHint();
                            // After a mouse click, drop focus so a later Enter key press (Letter Lock
                            // submits guesses with Enter) doesn't re-trigger this button.
                            if (e.detail > 0) e.currentTarget.blur();
                        }}
                        disabled={hintsLeft <= 0 || game.hintsRemaining <= 0}
                        title="Each hint reduces your score by 10%"
                    >
                        <Lightbulb size={16} strokeWidth={1.5} /> Hint ({hintsLeft}/{allowance})
                    </button>

                    {puzzle.autoCheck ? null : (
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            Submit Solution
                        </button>
                    )}
                </motion.div>
            )}

            {/* Result Overlay */}
            <AnimatePresence>
                {game.showResult && (
                    <motion.div
                        className="result-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="result-card"
                            initial={{ scale: 0.8, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                        >
                            <div className={`result-icon ${game.solved ? '' : 'fail'}`}>
                                {game.solved
                                    ? <CheckCircle size={52} strokeWidth={1.5} />
                                    : <AlertTriangle size={52} strokeWidth={1.5} />
                                }
                            </div>
                            <div className="result-title">
                                {game.solved
                                    ? (isDaily ? 'Well Solved!' : isFree ? 'Solved!' : 'Practice complete')
                                    : puzzle.type === 'letterLock' ? 'Out of guesses' : 'Not Quite Right'}
                            </div>
                            <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
                                {!game.solved
                                    ? (puzzle.type === 'letterLock'
                                        ? 'A fresh board is ready. Each board you run out of guesses on costs 10 points.'
                                        : 'Some answers are incorrect. Your entries are kept; fix them and submit again (−10 points per wrong submission).')
                                    : isFree
                                        ? 'Nice one. Free play doesn\'t count toward streaks or ranks, so try another or a harder level.'
                                        : isPractice
                                            ? 'Nice practice. This score stays on this device and doesn\'t count toward streaks or ranks.'
                                            : 'Challenge complete. Great work!'}
                            </p>

                            {game.solved && (
                                <>
                                    <ResultSquares hintsUsed={game.hintsUsed} mistakes={game.mistakes} />
                                    <div className="result-stats">
                                        <div className="result-stat">
                                            <div className="result-stat-value">{formatClock(game.timerSeconds)}</div>
                                            <div className="result-stat-label">Time</div>
                                        </div>
                                        <div className="result-stat">
                                            <div className="result-stat-value">{game.hintsUsed}</div>
                                            <div className="result-stat-label">Hints</div>
                                        </div>
                                        <div className="result-stat">
                                            <div className="result-stat-value">{game.mistakes}</div>
                                            <div className="result-stat-label">Mistakes</div>
                                        </div>
                                        <div className="result-stat">
                                            <div className="result-stat-value">{game.earnedPoints}</div>
                                            <div className="result-stat-label">Points</div>
                                        </div>
                                    </div>

                                    {isDaily && stats.currentStreak > 0 && (
                                        <div className="result-streak">
                                            <Flame size={18} strokeWidth={1.5} />
                                            {stats.currentStreak}-day streak
                                        </div>
                                    )}

                                    {isDaily && freezeEarned && (
                                        <div className="result-freeze">
                                            <Snowflake size={16} strokeWidth={1.5} />
                                            Streak freeze earned! If you miss a day, it saves your streak.
                                        </div>
                                    )}

                                    {newBadges.length > 0 && (
                                        <div className="result-badges">
                                            {newBadges.map(b => (
                                                <span key={b.id} className="result-badge">
                                                    <AchievementIcon iconKey={b.icon} size={16} />
                                                    {b.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {isDaily && <NextPuzzleCountdown style={{ marginTop: '8px' }} />}
                                </>
                            )}

                            <div className="flex-center gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                                {!game.solved ? (
                                    <button className="btn btn-primary" onClick={() => dispatch(retry())}>
                                        <RotateCcw size={16} strokeWidth={1.5} /> Keep trying
                                    </button>
                                ) : isFree ? (
                                    <>
                                        <button className="btn btn-primary"
                                            onClick={() => navigate(`/free/${freeSpec.type}/${freeSpec.level}/${Math.floor(Math.random() * 1e6)}`)}>
                                            <Dices size={16} strokeWidth={1.5} /> Another one
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => navigate('/free')}>
                                            <ArrowLeft size={16} strokeWidth={1.5} /> All games
                                        </button>
                                    </>
                                ) : isPractice ? (
                                    <>
                                        <button className="btn btn-primary" onClick={() => navigate('/practice')}>
                                            <CalendarDays size={16} strokeWidth={1.5} /> Back to archive
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                            <ArrowLeft size={16} strokeWidth={1.5} /> Home
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {shareText && <ShareButton text={shareText} className="btn btn-primary" />}
                                        <button className="btn btn-secondary" onClick={() => navigate('/practice')}>
                                            <CalendarDays size={16} strokeWidth={1.5} /> Practice more
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => navigate('/stats')}>
                                            <BarChart3 size={16} strokeWidth={1.5} /> Stats
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
