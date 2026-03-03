import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generatePuzzle,
  validateSolution,
  getPuzzleHint,
  getTodayDateString,
  preloadUpcomingPuzzles,
} from '../engine/generator.js';
import {
  PUZZLE_LABELS,
  PUZZLE_DESCRIPTIONS,
  POINTS_BASE,
  DIFFICULTY_LEVELS,
  GRANDMASTER_TIME_PENALTY_PER_30S,
  PUZZLE_HOW_TO_PLAY,
  getDifficultyForStreak,
} from '../utils/constants.js';
import {
  setPuzzle,
  updateAnswer,
  useHint,
  tickTimer,
  stopTimer,
  markSolved,
  markFailed,
  nextRound,
  resetGame,
  setLoading,
} from '../store/gameSlice.js';
import { recordSolve } from '../store/statsSlice.js';
import { saveAllState } from '../storage/db.js';
import { saveDailyActivity } from '../storage/activityStore.js';
import { syncDailyActivity } from '../utils/syncManager.js';
import NumberMatrixRenderer from '../components/puzzles/NumberMatrixRenderer.jsx';
import PatternMatchRenderer from '../components/puzzles/PatternMatchRenderer.jsx';
import SequenceSolverRenderer from '../components/puzzles/SequenceSolverRenderer.jsx';
import DeductionGridRenderer from '../components/puzzles/DeductionGridRenderer.jsx';
import BinaryLogicRenderer from '../components/puzzles/BinaryLogicRenderer.jsx';
import TruthAndLiesRenderer from '../components/puzzles/TruthAndLiesRenderer.jsx';
import BinaryBridgeRenderer from '../components/puzzles/BinaryBridgeRenderer.jsx';
import QuantumGridRenderer from '../components/puzzles/QuantumGridRenderer.jsx';
import {
  PuzzleIcon,
  Clock,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ArrowLeft,
  Zap,
  Star,
  Trophy,
  Info,
} from '../components/Icons.jsx';

function Confetti() {
  const pieces = useMemo(() => {
    const colors = [
      '#7752FE',
      '#414BEA',
      '#525CEB',
      '#F05537',
      '#D9E2FF',
      '#C2D9FF',
      '#BFCFE7',
    ];
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
      {pieces.map((p) => (
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

/**
 * Level-Up animation shown when a Grandmaster puzzle is solved.
 */
function LevelUpAnimation() {
  return (
    <motion.div
      className="level-up-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="level-up-badge"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
      >
        <Trophy size={48} strokeWidth={1.5} />
        <div className="level-up-text">LEVEL UP!</div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Difficulty Selection Screen
 */
function DifficultySelector({ suggestedDifficulty, onSelect, puzzleType }) {
  const levels = Object.values(DIFFICULTY_LEVELS);
  const howTo = PUZZLE_HOW_TO_PLAY[puzzleType];

  return (
    <motion.div
      className="difficulty-selector"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="difficulty-header">
        <PuzzleIcon type={puzzleType} size={40} />
        <h2 className="difficulty-title">{PUZZLE_LABELS[puzzleType]}</h2>
        <p className="text-muted">{PUZZLE_DESCRIPTIONS[puzzleType]}</p>
      </div>

      {/* How to Play */}
      {howTo && (
        <motion.div
          className="how-to-play"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="how-to-play-header">
            <Info size={18} strokeWidth={1.5} />
            <span>How to Play</span>
          </div>
          <ul className="how-to-play-rules">
            {howTo.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
          {howTo.tip && (
            <div className="how-to-play-tip">
              <Lightbulb size={14} strokeWidth={1.5} />
              <span>{howTo.tip}</span>
            </div>
          )}
        </motion.div>
      )}

      <div className="difficulty-cards">
        {levels.map((level, i) => (
          <motion.div
            key={level.key}
            className={`difficulty-card ${suggestedDifficulty?.key === level.key ? 'suggested' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(level)}
          >
            <div
              className="difficulty-badge"
              style={{ backgroundColor: level.color }}
            >
              {level.key === 'NOVICE' && <Star size={20} strokeWidth={1.5} />}
              {level.key === 'ADEPT' && <Zap size={20} strokeWidth={1.5} />}
              {level.key === 'GRANDMASTER' && <Trophy size={20} strokeWidth={1.5} />}
            </div>
            <div className="difficulty-card-body">
              <div className="difficulty-label">{level.label}</div>
              <div className="difficulty-meta">
                {level.hints > 0 ? `${level.hints} hint${level.hints > 1 ? 's' : ''}` : 'No hints'}
                {' • '}
                {level.multiplier}x points
              </div>
            </div>
            {suggestedDifficulty?.key === level.key && (
              <span className="difficulty-suggested-tag">Suggested</span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Play() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector((state) => state.game);
  const stats = useSelector((state) => state.stats);
  const userId = useSelector((state) => state.auth.user?.id);
  const timerRef = useRef(null);
  const [patternAnswers, setPatternAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [puzzleTypeForDate, setPuzzleTypeForDate] = useState(null);

  const todayDate = getTodayDateString();
  const alreadySolved = stats.heatmapData[todayDate] > 0;

  // Auto-suggest difficulty based on streak
  const suggestedDifficulty = useMemo(
    () => getDifficultyForStreak(stats.currentStreak),
    [stats.currentStreak],
  );

  // Determine puzzle type for today
  useEffect(() => {
    import('../engine/generator.js').then(({ getPuzzleTypeForDate }) => {
      setPuzzleTypeForDate(getPuzzleTypeForDate(todayDate));
    });
  }, [todayDate]);

  // Generate puzzle when difficulty is selected
  useEffect(() => {
    if (!selectedDifficulty || alreadySolved) return;

    dispatch(resetGame());
    setPatternAnswers({});
    dispatch(setLoading(true));

    generatePuzzle(todayDate, selectedDifficulty)
      .then((puzzle) => {
        dispatch(setPuzzle(puzzle));
        preloadUpcomingPuzzles().catch(console.warn);
      })
      .finally(() => {
        dispatch(setLoading(false));
      });
  }, [selectedDifficulty, userId]);

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

  const handleAnswer = useCallback(
    (answer, roundIdx) => {
      const puzzle = game.currentPuzzle;
      if (!puzzle) return;

      if (puzzle.type === 'patternMatch') {
        setPatternAnswers((prev) => ({ ...prev, [roundIdx]: answer }));
        dispatch(updateAnswer({ ...patternAnswers, [roundIdx]: answer }));
      } else {
        dispatch(updateAnswer(answer));
      }
    },
    [dispatch, game.currentPuzzle, patternAnswers],
  );

  const handleSubmit = async () => {
    const puzzle = game.currentPuzzle;
    if (!puzzle) return;

    let isCorrect = false;

    switch (puzzle.type) {
      case 'numberMatrix':
        isCorrect = await validateSolution('numberMatrix', game.userAnswer, puzzle.solution);
        break;
      case 'patternMatch':
        isCorrect = await validateSolution('patternMatch', patternAnswers, puzzle);
        break;
      case 'sequenceSolver':
        isCorrect = await validateSolution('sequenceSolver', game.userAnswer, puzzle);
        break;
      case 'deductionGrid':
        isCorrect = await validateSolution('deductionGrid', game.userAnswer, puzzle.solution);
        break;
      case 'binaryLogic':
        isCorrect = await validateSolution('binaryLogic', game.userAnswer, puzzle);
        break;
      case 'truthAndLies':
        isCorrect = await validateSolution('truthAndLies', game.userAnswer, puzzle);
        break;
      case 'binaryBridge':
        isCorrect = await validateSolution('binaryBridge', game.userAnswer, puzzle);
        break;
      case 'quantumGrid':
        isCorrect = await validateSolution('quantumGrid', game.userAnswer, puzzle);
        break;
    }

    if (isCorrect) {
      dispatch(markSolved());
      dispatch(stopTimer());
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);

      // Show Level Up animation for Grandmaster
      if (selectedDifficulty?.key === 'GRANDMASTER') {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      // Calculate points with difficulty multiplier and time penalty
      const diffConfig = selectedDifficulty || DIFFICULTY_LEVELS.NOVICE;
      let basePoints = Math.max(
        10,
        POINTS_BASE -
        game.hintsUsed * 20 -
        Math.floor(game.timerSeconds / 60) * 5,
      );

      // Grandmaster time penalty
      if (diffConfig.key === 'GRANDMASTER') {
        const timePenalty = Math.floor(game.timerSeconds / 30) * GRANDMASTER_TIME_PENALTY_PER_30S;
        basePoints = Math.max(10, basePoints - timePenalty);
      }

      const points = Math.round(basePoints * diffConfig.multiplier);

      dispatch(
        recordSolve({
          date: todayDate,
          points,
          timeSeconds: game.timerSeconds,
          puzzleType: puzzle.type,
          noMistakes: game.hintsUsed === 0,
          difficultyLevel: diffConfig.dbKey || 'EASY',
        }),
      );

      // Persist to user-scoped IndexedDB + sync to backend
      setTimeout(async () => {
        const state = window.__REDUX_STORE__?.getState();
        const currentUserId = state?.auth?.user?.id;
        const token = state?.auth?.token;

        if (state && currentUserId) {
          await saveAllState(currentUserId, state.stats, state.settings);

          const dailyData = {
            date: todayDate,
            solved: true,
            score: points,
            puzzleType: puzzle.type,
            timeSeconds: game.timerSeconds,
            hintsUsed: game.hintsUsed,
            noMistakes: game.hintsUsed === 0,
            difficultyLevel: diffConfig.dbKey || 'EASY',
            gameType: puzzle.type,
          };

          await saveDailyActivity(currentUserId, dailyData);

          // Immediate sync
          const apiUrl = import.meta.env.VITE_API_URL || '/api';
          try {
            await fetch(`${apiUrl}/daily-scores`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(dailyData),
            });
          } catch (e) {
            console.warn('Immediate sync failed:', e);
          }

          await syncDailyActivity(currentUserId, token);
        }
      }, 500);
    } else {
      dispatch(markFailed());
    }
  };

  const handleHint = () => {
    const maxHints = selectedDifficulty?.hints ?? 3;
    if (game.hintsUsed >= maxHints) return;
    dispatch(useHint());
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

  // Difficulty selection screen (before puzzle loads)
  if (!selectedDifficulty && !alreadySolved && puzzleTypeForDate) {
    return (
      <DifficultySelector
        suggestedDifficulty={suggestedDifficulty}
        onSelect={setSelectedDifficulty}
        puzzleType={puzzleTypeForDate}
      />
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
  const diffConfig = selectedDifficulty || DIFFICULTY_LEVELS.NOVICE;
  const maxHints = diffConfig.hints;

  // Render the appropriate puzzle component
  const renderPuzzle = () => {
    switch (puzzle.type) {
      case 'numberMatrix':
        return <NumberMatrixRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'patternMatch':
        return (
          <PatternMatchRenderer
            puzzle={puzzle}
            onAnswer={handleAnswer}
            currentRound={game.currentRound}
          />
        );
      case 'sequenceSolver':
        return <SequenceSolverRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'deductionGrid':
        return <DeductionGridRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'binaryLogic':
        return <BinaryLogicRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'truthAndLies':
        return <TruthAndLiesRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'binaryBridge':
        return <BinaryBridgeRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      case 'quantumGrid':
        return <QuantumGridRenderer puzzle={puzzle} onAnswer={handleAnswer} />;
      default:
        return <div>Unknown puzzle type</div>;
    }
  };

  return (
    <div>
      {showConfetti && <Confetti />}
      <AnimatePresence>{showLevelUp && <LevelUpAnimation />}</AnimatePresence>

      {/* Header Bar */}
      <div className="play-header">
        <div className="play-info">
          <span className="play-info-icon">
            <PuzzleIcon type={puzzle.type} size={24} />
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>{PUZZLE_LABELS[puzzle.type]}</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
              {todayDate}
            </div>
          </div>
          <span
            className="badge badge-difficulty"
            style={{ backgroundColor: diffConfig.color, color: '#fff' }}
          >
            {diffConfig.label}
          </span>
        </div>
        <div className="play-actions">
          <div className="timer-bar">
            <span className="timer-icon">
              <Clock size={16} strokeWidth={1.5} />
            </span>
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
          {maxHints > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleHint}
              disabled={game.hintsUsed >= maxHints}
            >
              <Lightbulb size={16} strokeWidth={1.5} /> Hint (
              {Math.max(0, maxHints - game.hintsUsed)}/{maxHints})
            </button>
          )}

          {puzzle.type === 'patternMatch' &&
            game.currentRound < puzzle.totalRounds - 1 ? (
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
                {game.solved ? (
                  <CheckCircle size={56} strokeWidth={1.5} />
                ) : (
                  <AlertTriangle size={56} strokeWidth={1.5} />
                )}
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
                    <div className="result-stat-value">
                      {formatTime(game.timerSeconds)}
                    </div>
                    <div className="result-stat-label">Time</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-stat-value">{game.hintsUsed}</div>
                    <div className="result-stat-label">Hints Used</div>
                  </div>
                  <div className="result-stat">
                    <div className="result-stat-value">
                      {(() => {
                        let bp = Math.max(10, POINTS_BASE - game.hintsUsed * 20 - Math.floor(game.timerSeconds / 60) * 5);
                        if (diffConfig.key === 'GRANDMASTER') {
                          bp = Math.max(10, bp - Math.floor(game.timerSeconds / 30) * GRANDMASTER_TIME_PENALTY_PER_30S);
                        }
                        return Math.round(bp * diffConfig.multiplier);
                      })()}
                    </div>
                    <div className="result-stat-label">Points ({diffConfig.multiplier}x)</div>
                  </div>
                </div>
              )}

              <div className="flex-center gap-8 mt-16">
                {game.solved ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                  >
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
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/stats')}
                >
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
