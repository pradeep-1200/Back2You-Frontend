import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ItemCard = ({ item }) => {
  const trustScore = item.userId?.trustScore ?? 0;
  const trustLabel = trustScore >= 80 ? 'Trusted' : trustScore >= 40 ? 'Neutral' : 'Risky';

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="item-card card"
    >
      <Link to={`/item/${item._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="item-image-wrapper">
          <span className={`status-badge status-${item.status}`}>
            {item.status}
          </span>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="item-image" />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>
        <div className="item-info">
          <h3>{item.title}</h3>
          {item.userId && (
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', fontWeight: 700, color: trustScore >= 80 ? '#166534' : trustScore >= 40 ? '#92400e' : '#b91c1c' }}>
              {item.userId.name} • {trustLabel} ({trustScore})
            </p>
          )}
          <p>{item.description}</p>
          <div className="tags">
            {item.tags?.slice(0, 3).map((t, i) => (
              <span key={i} className="tag">#{t}</span>
            ))}
            {item.tags?.length > 3 && <span className="tag">+{item.tags.length - 3}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ItemCard;
