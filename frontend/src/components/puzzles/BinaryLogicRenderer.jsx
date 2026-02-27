import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function BinaryLogicRenderer({ puzzle, onAnswer }) {
  const { inputs, gates, questions } = puzzle;
  const [answers, setAnswers] = useState({});
  const [glowingGate, setGlowingGate] = useState(null);

  function handleChange(gateId, value) {
    const newAnswers = { ...answers, [gateId]: value };
    setAnswers(newAnswers);
    onAnswer(newAnswers);
  }

  function handleGateClick(gateId) {
    setGlowingGate(gateId);
    setTimeout(() => setGlowingGate(null), 600);
  }

  const isQuestion = (gateId) => questions.some((q) => q.gateId === gateId);

  return (
    <div className="puzzle-area">
      <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
        Determine the output of each highlighted gate (0 or 1)
      </p>

      {/* Inputs */}
      <div className="circuit-inputs">
        {inputs.map((inp) => (
          <motion.div
            key={inp.id}
            className="circuit-input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="circuit-label">{inp.label}</span>
            <span className={`circuit-value v-${inp.value}`}>{inp.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Gate Layers */}
      <div className="circuit-container">
        {gates.map((layer, li) => (
          <motion.div
            key={li}
            className="gate-layer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + li * 0.15 }}
          >
            {layer.map((gate) => {
              const unknown = isQuestion(gate.id);
              const isGlowing = glowingGate === gate.id;
              return (
                <motion.div
                  key={gate.id}
                  className={`gate-box ${unknown ? 'unknown' : ''}`}
                  onClick={() => handleGateClick(gate.id)}
                  animate={
                    isGlowing
                      ? {
                          boxShadow: [
                            '0 0 0px rgba(119, 82, 254, 0)',
                            '0 0 20px rgba(119, 82, 254, 0.6)',
                            '0 0 40px rgba(119, 82, 254, 0.3)',
                            '0 0 0px rgba(119, 82, 254, 0)',
                          ],
                          borderColor: [
                            'var(--border-color)',
                            '#7752FE',
                            '#7752FE',
                            'var(--border-color)',
                          ],
                        }
                      : {}
                  }
                  transition={
                    isGlowing ? { duration: 0.6, ease: 'easeOut' } : {}
                  }
                  whileTap={{
                    boxShadow: '0 0 20px rgba(119, 82, 254, 0.5)',
                    borderColor: '#7752FE',
                  }}
                >
                  <span className="gate-type">{gate.type}</span>
                  <div
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                  >
                    {gate.inputs
                      .map((id) => {
                        const inp = inputs.find((i) => i.id === id);
                        return inp ? inp.label : id.replace('gate_', 'G');
                      })
                      .join(gate.type === 'NOT' ? '' : ' , ')}
                  </div>
                  {unknown ? (
                    <div className="gate-output">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={answers[gate.id] ?? ''}
                        onChange={(e) => handleChange(gate.id, e.target.value)}
                        placeholder="?"
                      />
                    </div>
                  ) : (
                    <span
                      className={`gate-output v-${gate.output}`}
                      style={{
                        color:
                          gate.output === 1
                            ? 'var(--accent-success)'
                            : 'var(--accent-danger)',
                      }}
                    >
                      {gate.output}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
