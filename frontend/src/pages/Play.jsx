import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePuzzle, validateSolution, getPuzzleHint, getTodayDateString, getPuzzleTypeForDate } from '../engine/generator.js';
import { PUZZLE_LABELS, PUZZLE_DESCRIPTIONS, PUZZLE_RULES, POINTS_BASE, MAX_HINTS, DIFFICULTY_LEVELS, HINT_ALLOWANCE, calculateFinalScore } from '../utils/constants.js';
import { setPuzzle, updateAnswer, useHint, addHintedCell, tickTimer, stopTimer, markSolved, markFailed, nextRound, resetGame, setDifficulty } from '../store/gameSlice.js';
import { recordSolve } from '../store/statsSlice.js';
import { saveAllState } from '../storage/db.js';
import { saveDailyActivity } from '../storage/activityStore.js';
import { syncDailyActivity } from '../utils/syncManager.js';
import NumberMatrixRenderer from '../components/puzzles/NumberMatrixRenderer.jsx';
import PatternMatchRenderer from '../components/puzzles/PatternMatchRenderer.jsx';
import SequenceSolverRenderer from '../components/puzzles/SequenceSolverRenderer.jsx';
import DeductionGridRenderer from '../components/puzzles/DeductionGridRenderer.jsx';
import BinaryLogicRenderer from '../components/puzzles/BinaryLogicRenderer.jsx';
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
} from '../components/Icons.jsx';

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

export default function Play() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const game = useSelector(state => state.game);
    const stats = useSelector(state => state.stats);
    const userId = useSelector(state => state.auth.user?.id);
    const timerRef = useRef(null);
    const [patternAnswers, setPatternAnswers] = useState({});
    const [showConfetti, setShowConfetti] = useState(false);

    const todayDate = getTodayDateString();
    const alreadySolved = stats.heatmapData[todayDate] > 0;

    useEffect(() => {
        dispatch(resetGame());
        setPatternAnswers({});
    }, [userId]);

    const handleSelectDifficulty = (level) => {
        dispatch(setDifficulty(level.key));
        const puzzle = generatePuzzle(todayDate, level.modifier);
        dispatch(setPuzzle(puzzle));
        // Note: hintsRemaining is set to MAX_HINTS in setPuzzle,
        // but we respect HINT_ALLOWANCE per difficulty
    };

    useEffect(() => {
        if (game.timerRunning) {
            timerRef.current = setInterval(() => {
                dispatch(tickTimer());
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [game.timerRunning, dispatch]);

    const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = useCallback((answer, roundIdx) => {
        const puzzle = game.currentPuzzle;
        if (!puzzle) return;
        if (puzzle.type === 'patternMatch') {
            setPatternAnswers(prev => ({ ...prev, [roundIdx]: answer }));
            dispatch(updateAnswer({ ...patternAnswers, [roundIdx]: answer }));
        } else {
            dispatch(updateAnswer(answer));
        }
    }, [dispatch, game.currentPuzzle, patternAnswers]);

    const handleSubmit = () => {
        const puzzle = game.currentPuzzle;
        if (!puzzle) return;

        let isCorrect = false;
        switch (puzzle.type) {
            case 'numberMatrix':
                isCorrect = validateSolution('numberMatrix', game.userAnswer, puzzle);
                break;
            case 'patternMatch':
                isCorrect = validateSolution('patternMatch', patternAnswers, puzzle);
                break;
            case 'sequenceSolver':
                isCorrect = validateSolution('sequenceSolver', game.userAnswer, puzzle);
                break;
            case 'deductionGrid':
                isCorrect = validateSolution('deductionGrid', game.userAnswer, puzzle.solution);
                break;
            case 'binaryLogic':
                isCorrect = validateSolution('binaryLogic', game.userAnswer, puzzle);
                break;
        }

        if (isCorrect) {
            dispatch(markSolved());
            dispatch(stopTimer());
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3500);

            const points = calculateFinalScore(game.hintsUsed, game.timerSeconds);
            dispatch(recordSolve({
                date: todayDate,
                points,
                timeSeconds: game.timerSeconds,
                puzzleType: puzzle.type,
                noMistakes: game.hintsUsed === 0,
            }));

            setTimeout(async () => {
                const state = window.__REDUX_STORE__?.getState();
                const currentUserId = state?.auth?.user?.id;
                if (state && currentUserId) {
                    await saveAllState(currentUserId, state.stats, state.settings);
                    await saveDailyActivity(currentUserId, {
                        date: todayDate, solved: true, score: points,
                        puzzleType: puzzle.type, timeSeconds: game.timerSeconds,
                        hintsUsed: game.hintsUsed, noMistakes: game.hintsUsed === 0,
                    });
                    const token = state.auth.token;
                    await syncDailyActivity(currentUserId, token);
                    if (navigator.onLine && token) {
                        const apiUrl = import.meta.env.VITE_API_URL || '/api';
                        try {
                            await fetch(`${apiUrl}/stats/sync`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ stats: state.stats }),
                            });
                        } catch { }
                    }
                }
            }, 500);
        } else {
            dispatch(markFailed());
        }
    };

    /**
     * useHint() — Finds the first incorrect/empty cell and reveals the correct value.
     * Uses puzzle-type-specific logic from the engine.
     * Dispatches addHintedCell so the renderer can animate with Bluestock Orange.
     */
    const handleHint = () => {
        // Check difficulty-based hint allowance
        const allowance = HINT_ALLOWANCE[game.selectedDifficulty] || MAX_HINTS;
        if (game.hintsUsed >= allowance) return;
        if (game.hintsRemaining <= 0) return;

        const puzzle = game.currentPuzzle;
        if (!puzzle) return;

        let hintData = null;

        switch (puzzle.type) {
            case 'numberMatrix': {
                // Find first empty or incorrect cell and reveal correct value
                const userGrid = game.userAnswer || puzzle.puzzle;
                const solution = puzzle.solution;
                const size = puzzle.size;
                for (let r = 0; r < size && !hintData; r++) {
                    for (let c = 0; c < size && !hintData; c++) {
                        if (!puzzle.given[r][c]) {
                            const userVal = userGrid?.[r]?.[c] || 0;
                            if (userVal !== solution[r][c]) {
                                hintData = { type: 'cell', row: r, col: c, value: solution[r][c] };
                            }
                        }
                    }
                }
                break;
            }
            case 'sequenceSolver': {
                // Find first unfilled blank
                const rounds = puzzle.rounds;
                for (let ri = 0; ri < rounds.length && !hintData; ri++) {
                    const round = rounds[ri];
                    for (let bi = 0; bi < round.blanks.length && !hintData; bi++) {
                        const key = `${ri}-${bi}`;
                        const userVal = game.userAnswer?.[key];
                        const correctVal = round.sequence[round.blanks[bi]];
                        if (!userVal || parseInt(userVal) !== correctVal) {
                            hintData = { type: 'sequence', key, value: correctVal };
                        }
                    }
                }
                break;
            }
            case 'binaryLogic': {
                // Find first unanswered gate
                for (const q of puzzle.questions) {
                    const userVal = game.userAnswer?.[q.gateId];
                    if (userVal === undefined || userVal === '' || parseInt(userVal) !== q.answer) {
                        hintData = { type: 'gate', gateId: q.gateId, value: q.answer };
                        break;
                    }
                }
                break;
            }
            case 'deductionGrid': {
                // Reveal one correct assignment
                const solution = puzzle.solution.assignments;
                const names = Object.keys(solution);
                for (const name of names) {
                    const userAssign = game.userAnswer?.[name];
                    if (!userAssign || userAssign.color !== solution[name].color || userAssign.item !== solution[name].item) {
                        hintData = { type: 'assignment', name, ...solution[name] };
                        break;
                    }
                }
                break;
            }
            case 'patternMatch': {
                // Eliminate one wrong option in current round
                const round = puzzle.rounds[game.currentRound];
                if (round) {
                    const wrongIndices = round.options
                        .map((_, i) => i)
                        .filter(i => i !== round.answerIndex);
                    if (wrongIndices.length > 0) {
                        hintData = { type: 'eliminate', eliminateIndex: wrongIndices[game.hintsUsed % wrongIndices.length] };
                    }
                }
                break;
            }
        }

        if (hintData) {
            dispatch(useHint());
            dispatch(addHintedCell(hintData));
        }
    };

    // Already solved today
    if (alreadySolved && !game.currentPuzzle) {
        return (
            <motion.div
                className="flex-center flex-col"
                style={{ minHeight: '60vh', gap: '16px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div style={{ color: 'var(--accent-success)' }}>
                    <CheckCircle size={56} strokeWidth={1.5} />
                </div>
                <h2>Today's Challenge Complete</h2>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Come back tomorrow for a new challenge</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} strokeWidth={1.5} /> Back Home
                </button>
            </motion.div>
        );
    }

    // Difficulty selection screen
    if (!game.currentPuzzle) {
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

    const puzzle = game.currentPuzzle;

    const renderPuzzle = () => {
        switch (puzzle.type) {
            case 'numberMatrix':
                return <NumberMatrixRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'patternMatch':
                return <PatternMatchRenderer puzzle={puzzle} onAnswer={handleAnswer} currentRound={game.currentRound} />;
            case 'sequenceSolver':
                return <SequenceSolverRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'deductionGrid':
                return <DeductionGridRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
            case 'binaryLogic':
                return <BinaryLogicRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
            default:
                return <div>Unknown puzzle type</div>;
        }
    };

    return (
        <div>
            {showConfetti && <Confetti />}

            {/* Floating status bar */}
            <div className="play-header">
                <div className="play-info">
                    <span className="play-info-icon">
                        <PuzzleIcon type={puzzle.type} size={22} />
                    </span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{PUZZLE_LABELS[puzzle.type]}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{todayDate}</div>
                    </div>
                    <span className="badge badge-difficulty">
                        {game.selectedDifficulty || 'D' + puzzle.difficulty}
                    </span>
                </div>
                <div className="play-actions">
                    <div className="timer-bar">
                        <span className="timer-icon"><Clock size={14} strokeWidth={1.5} /></span>
                        {formatTime(game.timerSeconds)}
                    </div>
                </div>
            </div>

            {/* How to Play accordion */}
            <HowToPlay puzzleType={puzzle.type} />

            {/* Puzzle Area */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                {renderPuzzle()}
            </motion.div>

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
                        onClick={handleHint}
                        disabled={game.hintsUsed >= (HINT_ALLOWANCE[game.selectedDifficulty] || MAX_HINTS) || game.hintsRemaining <= 0}
                    >
                        <Lightbulb size={16} strokeWidth={1.5} /> Hint ({(HINT_ALLOWANCE[game.selectedDifficulty] || MAX_HINTS) - game.hintsUsed}/{HINT_ALLOWANCE[game.selectedDifficulty] || MAX_HINTS})
                    </button>

                    {puzzle.type === 'patternMatch' && game.currentRound < puzzle.totalRounds - 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => dispatch(nextRound())}
                            disabled={patternAnswers[game.currentRound] === undefined}
                        >
                            Next Round
                        </button>
                    ) : (
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
                                {game.solved ? 'Well Solved!' : 'Not Quite Right'}
                            </div>
                            <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
                                {game.solved
                                    ? 'Challenge complete — great work!'
                                    : 'Some answers were incorrect. Try again!'}
                            </p>

                            {game.solved && (
                                <div className="result-stats">
                                    <div className="result-stat">
                                        <div className="result-stat-value">{formatTime(game.timerSeconds)}</div>
                                        <div className="result-stat-label">Time</div>
                                    </div>
                                    <div className="result-stat">
                                        <div className="result-stat-value">{game.hintsUsed}</div>
                                        <div className="result-stat-label">Hints</div>
                                    </div>
                                    <div className="result-stat">
                                        <div className="result-stat-value">
                                            {calculateFinalScore(game.hintsUsed, game.timerSeconds)}
                                        </div>
                                        <div className="result-stat-label">Points</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-center gap-8 mt-16">
                                {game.solved ? (
                                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                                        <ArrowLeft size={16} strokeWidth={1.5} /> Home
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            dispatch(markFailed());
                                            dispatch(setPuzzle(game.currentPuzzle));
                                        }}
                                    >
                                        <RotateCcw size={16} strokeWidth={1.5} /> Try Again
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={() => navigate('/stats')}>
                                    <BarChart3 size={16} strokeWidth={1.5} /> Stats
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
