import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SequenceSolverRenderer({ puzzle, onAnswer }) {
  const [answers, setAnswers] = useState({});

  function handleChange(roundIdx, blankIdx, value) {
    const key = `${roundIdx}-${blankIdx}`;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    onAnswer(newAnswers);
  }

  return (
    <div className="puzzle-area">
      <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
        Find the pattern and fill in the missing numbers
      </p>

      {puzzle.rounds.map((round, ri) => (
        <motion.div
          key={ri}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ri * 0.15 }}
          style={{ marginBottom: '24px' }}
        >
          <p className="text-muted mb-8" style={{ fontSize: '0.8rem' }}>
            Sequence {ri + 1} of {puzzle.totalRounds}
          </p>
          <div className="sequence-row">
            {round.sequence.map((num, si) => {
              const blankIndex = round.blanks.indexOf(si);
              const isBlank = blankIndex !== -1;

              return (
                <React.Fragment key={si}>
                  {si > 0 && <span className="sequence-arrow">→</span>}
                  {isBlank ? (
                    <motion.div
                      className="sequence-num sequence-blank"
                      whileFocus={{
                        scale: 1.05,
                        borderColor: 'var(--accent-primary)',
                      }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={answers[`${ri}-${blankIndex}`] || ''}
                        onChange={(e) =>
                          handleChange(ri, blankIndex, e.target.value)
                        }
                        placeholder="?"
                      />
                    </motion.div>
                  ) : (
                    <div className="sequence-num">{num}</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
