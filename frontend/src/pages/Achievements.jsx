import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '../utils/constants.js';
import { Award, AchievementIcon } from '../components/Icons.jsx';

export default function Achievements() {
  const stats = useSelector((state) => state.stats);
  const unlockedIds = stats.achievements;

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-title">
          <Award size={24} strokeWidth={1.5} /> Achievements
        </h1>
        <p className="page-subtitle">
          {unlockedIds.length} of {ACHIEVEMENTS.length} unlocked
        </p>
      </motion.div>

      <div className="achievement-grid">
        {ACHIEVEMENTS.map((ach, i) => {
          const unlocked = unlockedIds.includes(ach.id);
          return (
            <motion.div
              key={ach.id}
              className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={unlocked ? { scale: 1.05, y: -4 } : {}}
            >
              <span className="achievement-icon">
                <AchievementIcon iconKey={ach.icon} size={28} />
              </span>
              <span className="achievement-name">{ach.name}</span>
              <span className="achievement-desc">{ach.desc}</span>
              {unlocked && (
                <span
                  className="badge badge-streak"
                  style={{ marginTop: '4px' }}
                >
                  Unlocked
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
