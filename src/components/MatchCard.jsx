import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MatchCard = ({ matchInfo }) => {
  const { item, score, commonTags } = matchInfo;
  if (!item) return null;

  let scoreColor = '#ef4444'; // Red (weak)
  if (score >= 80) scoreColor = '#10b981'; // Green (strong)
  else if (score >= 50) scoreColor = '#f59e0b'; // Yellow (medium)

  return (
    <motion.div 
       whileHover={{ scale: 1.02, x: 5 }}
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       className="match-card card"
    >
      <Link to={`/item/${item._id}`} className="match-card-content">
        <div className="match-image">
           {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="match-no-image">📸</div>}
        </div>
        <div className="match-details">
          <div className="match-header">
            <h4>{item.title}</h4>
          </div>
          
          <div className="score-container mt-2">
            <div className="score-header">
              <span className="score-text" style={{color: scoreColor}}>{score}% Match Score</span>
            </div>
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ backgroundColor: scoreColor }}
              />
            </div>
            {matchInfo.explanation && <p className="match-explanation" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>ℹ️ {matchInfo.explanation}</p>}
          </div>

          <div className="match-tags mt-2">
            {commonTags?.map((t, i) => <span key={i} className="match-tag" style={{ border: `1px solid ${scoreColor}40`}}>🔥 {t}</span>)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MatchCard;
