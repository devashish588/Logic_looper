import React from 'react';
import { motion } from 'framer-motion';

const ShapeSVG = ({ shape, color, rotation }) => {
    const style = { transform: `rotate(${rotation}deg)` };

    const shapes = {
        circle: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <circle cx="20" cy="20" r="16" fill={color} />
            </svg>
        ),
        square: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <rect x="4" y="4" width="32" height="32" rx="3" fill={color} />
            </svg>
        ),
        triangle: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <polygon points="20,4 36,36 4,36" fill={color} />
            </svg>
        ),
        diamond: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <polygon points="20,2 38,20 20,38 2,20" fill={color} />
            </svg>
        ),
        star: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <polygon points="20,2 25,14 38,16 28,26 31,38 20,32 9,38 12,26 2,16 15,14" fill={color} />
            </svg>
        ),
        hexagon: (
            <svg className="shape-svg" viewBox="0 0 40 40" style={style}>
                <polygon points="20,2 36,10 36,30 20,38 4,30 4,10" fill={color} />
            </svg>
        ),
    };

    return shapes[shape] || shapes.circle;
};

export default function PatternMatchRenderer({ puzzle, onAnswer, currentRound = 0 }) {
    const round = puzzle.rounds[currentRound];
    if (!round) return null;

    const [selectedOption, setSelectedOption] = React.useState(null);
    const [eliminated, setEliminated] = React.useState([]);

    React.useEffect(() => {
        setSelectedOption(null);
        setEliminated([]);
    }, [currentRound]);

    function handleSelect(idx) {
        if (eliminated.includes(idx)) return;
        setSelectedOption(idx);
        onAnswer(idx, currentRound);
    }

    return (
        <div className="puzzle-area">
            <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
                Round {currentRound + 1} of {puzzle.totalRounds} — Find the next pattern
            </p>

            {/* Show sequence */}
            <div className="pattern-container">
                {round.sequence.map((item, i) => (
                    <motion.div
                        key={i}
                        className="pattern-shape"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ background: 'var(--bg-glass)' }}
                    >
                        <ShapeSVG shape={item.shape} color={item.color} rotation={item.rotation} />
                    </motion.div>
                ))}

                {/* Question mark */}
                <motion.div
                    className="pattern-shape"
                    style={{
                        background: 'var(--bg-glass)',
                        border: '2px dashed var(--accent-primary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '1.5rem',
                        color: 'var(--accent-primary)',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    ?
                </motion.div>
            </div>

            {/* Options */}
            <p className="text-muted mt-24 mb-8" style={{ fontSize: '0.8rem' }}>Choose the next element:</p>
            <div className="pattern-container">
                {round.options.map((item, i) => (
                    <motion.div
                        key={i}
                        className={`pattern-shape pattern-option ${selectedOption === i ? 'selected' : ''
                            } ${eliminated.includes(i) ? 'eliminated' : ''}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(i)}
                    >
                        <ShapeSVG shape={item.shape} color={item.color} rotation={item.rotation} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
