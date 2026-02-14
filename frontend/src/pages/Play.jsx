import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePuzzle, validateSolution, getPuzzleHint, getTodayDateString } from '../engine/generator.js';
import { PUZZLE_LABELS, PUZZLE_DESCRIPTIONS, POINTS_BASE, MAX_HINTS } from '../utils/constants.js';
import { setPuzzle, updateAnswer, useHint, tickTimer, stopTimer, markSolved, markFailed, nextRound, resetGame } from '../store/gameSlice.js';
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
} from '../components/Icons.jsx';

function Confetti() {
    const pieces = useMemo(() => {
        const colors = ['#7752FE', '#414BEA', '#525CEB', '#F05537', '#D9E2FF', '#C2D9FF', '#BFCFE7'];
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

    // Reset game state and generate puzzle when user changes or on mount
    useEffect(() => {
        dispatch(resetGame());
        setPatternAnswers({});
        if (!alreadySolved) {
            const puzzle = generatePuzzle(todayDate);
            dispatch(setPuzzle(puzzle));
        }
    }, [userId]);

    // Timer
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
                isCorrect = validateSolution('numberMatrix', game.userAnswer, puzzle.solution);
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

            const points = Math.max(10, POINTS_BASE - game.hintsUsed * 20 - Math.floor(game.timerSeconds / 60) * 5);
            dispatch(recordSolve({
                date: todayDate,
                points,
                timeSeconds: game.timerSeconds,
                puzzleType: puzzle.type,
                noMistakes: game.hintsUsed === 0,
            }));

            // Persist to user-scoped IndexedDB + sync to backend
            setTimeout(async () => {
                const state = window.__REDUX_STORE__?.getState();
                const currentUserId = state?.auth?.user?.id;
                if (state && currentUserId) {
                    await saveAllState(currentUserId, state.stats, state.settings);

                    // Save to daily_activity IndexedDB store
                    await saveDailyActivity(currentUserId, {
                        date: todayDate,
                        solved: true,
                        score: points,
                        puzzleType: puzzle.type,
                        timeSeconds: game.timerSeconds,
                        hintsUsed: game.hintsUsed,
                        noMistakes: game.hintsUsed === 0,
                    });

                    // Lazy sync: push unsynced entries to backend
                    const token = state.auth.token;
                    await syncDailyActivity(currentUserId, token);
                }
            }, 500);
        } else {
            dispatch(markFailed());
        }
    };

    const handleHint = () => {
        if (game.hintsRemaining <= 0) return;
        dispatch(useHint());
        // Hint logic is visual — handled by each renderer
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
                    <CheckCircle size={64} strokeWidth={1.5} />
                </div>
                <h2>Today's Challenge Complete</h2>
                <p className="text-muted">Come back tomorrow for a new challenge</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} strokeWidth={1.5} /> Back Home
                </button>
            </motion.div>
        );
    }

    if (!game.currentPuzzle) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="text-muted">Loading puzzle...</div>
            </div>
        );
    }

    const puzzle = game.currentPuzzle;

    // Render the appropriate puzzle component
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

            {/* Header Bar */}
            <div className="play-header">
                <div className="play-info">
                    <span className="play-info-icon">
                        <PuzzleIcon type={puzzle.type} size={24} />
                    </span>
                    <div>
                        <div style={{ fontWeight: 700 }}>{PUZZLE_LABELS[puzzle.type]}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{todayDate}</div>
                    </div>
                    <span className="badge badge-difficulty">
                        Difficulty {puzzle.difficulty}
                    </span>
                </div>
                <div className="play-actions">
                    <div className="timer-bar">
                        <span className="timer-icon"><Clock size={16} strokeWidth={1.5} /></span>
                        {formatTime(game.timerSeconds)}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="puzzle-instructions">
                {PUZZLE_DESCRIPTIONS[puzzle.type]}
            </div>

            {/* Puzzle Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
                        disabled={game.hintsRemaining <= 0}
                    >
                        <Lightbulb size={16} strokeWidth={1.5} /> Hint ({game.hintsRemaining}/{MAX_HINTS})
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
                                    ? <CheckCircle size={56} strokeWidth={1.5} />
                                    : <AlertTriangle size={56} strokeWidth={1.5} />
                                }
                            </div>
                            <div className="result-title">
                                {game.solved ? 'Well solved' : 'Not quite right'}
                            </div>
                            <p className="text-muted mb-16">
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
                                        <div className="result-stat-label">Hints Used</div>
                                    </div>
                                    <div className="result-stat">
                                        <div className="result-stat-value">
                                            {Math.max(10, POINTS_BASE - game.hintsUsed * 20 - Math.floor(game.timerSeconds / 60) * 5)}
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
