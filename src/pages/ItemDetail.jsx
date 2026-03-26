import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, createClaim } from '../services/api';
import MatchCard from '../components/MatchCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Tag, Box, ArrowLeft } from 'lucide-react';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [claimModal, setClaimModal] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    getItemById(id)
      .then(({ data }) => setItem(data))
      .catch(() => toast.error("Failed to fetch item details"))
      .finally(() => setLoading(false));
  }, [id]);

  const submitClaim = async () => {
    if(!claimText.trim()) return toast.error("Proof is required to claim!");
    setClaiming(true);
    const toastId = toast.loading("Submitting Security Claim...");
    try {
      await createClaim({ itemId: item._id, userId: '60b8d295f1d4f4001550c822', proofMessage: claimText });
      toast.success("Claim Request Submitted! Sent for review.", { id: toastId });
      setClaimModal(false);
      setClaimText('');
    } catch(e) {
      toast.error("Failed submitting claim", { id: toastId });
    } finally {
      setClaiming(false);
    }
  }

  if (loading) return (
    <div className="skeleton-detail">
      <div className="skeleton-card skeleton-img card"></div>
      <div className="skeleton-card skeleton-info card"></div>
    </div>
  );
  
  if (!item) return <div className="empty-state card"><h2>Entry Corrupted</h2></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="detail-container">
      <button onClick={() => navigate(-1)} className="back-btn button">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="detail-grid">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="detail-img-box card">
          <span className={`status-badge-lg status-${item.status}`}>
            {item.status === 'lost' ? 'Reported Lost 🔴' : 'Reported Found 🟢'}
          </span>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="detail-no-img"><Box size={64}/></div>}
        </motion.div>
        
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="detail-info-box card">
          <h1>{item.title}</h1>
          <div className="meta-info">Reported by Anonymous • {new Date(item.createdAt).toLocaleDateString()}</div>
          
          <div className="desc-section">
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>
          
          <div className="tags-section">
             <h3>Associated Tags</h3>
             <div className="tags-list">
               {item.tags?.map((t, i) => <span key={i} className="chip"><Tag size={12}/> {t}</span>)}
             </div>
          </div>

          <motion.button 
             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
             className="btn-primary claim-trigger"
             onClick={() => setClaimModal(true)}
          >
             <ShieldCheck size={20}/> Ensure Claim Ownership
          </motion.button>
        </motion.div>
      </div>

      {item.matches?.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="advanced-matches-section card">
          <div className="match-header-title">
            <h2>🔥 High Probability Matches ({item.matches.length})</h2>
            <p className="subtitle">Our algorithm found the following similar reports.</p>
          </div>
          <div className="match-cards-grid">
            {item.matches.map(m => <MatchCard key={m.item?._id || m._id} matchInfo={m} />)}
          </div>
        </motion.div>
      )}

      {/* Modern Modal UX */}
      <AnimatePresence>
        {claimModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setClaimModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content card"
              onClick={e => e.stopPropagation()}
            >
              <h2>Secure Claim Initialization</h2>
              <p>For security, please provide precise details proving this item belongs to you (e.g. secret pocket, damage, IMEI).</p>
              
              <textarea 
                className="form-input mt-4" rows="4" 
                placeholder="I know this is mine because..."
                value={claimText} onChange={e => setClaimText(e.target.value)}
              />
              <div className="modal-actions mt-4">
                 <button className="button cancel-btn" onClick={() => setClaimModal(false)}>Cancel</button>
                 <button className="btn-primary submit-btn" disabled={claiming} onClick={submitClaim}>
                   {claiming ? 'Processing...' : 'Submit Evidence'}
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemDetail;
