import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, createClaim } from '../services/api';
import MatchCard from '../components/MatchCard';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Tag, Box, ArrowLeft, Bookmark, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [claimModal, setClaimModal] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [claims, setClaims] = useState([]);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    getItemById(id)
      .then(({ data }) => setItem(data))
      .catch(() => toast.error("Failed to fetch item details"))
      .finally(() => setLoading(false));

    if (user && user.savedItems) {
      if (typeof user.savedItems[0] === 'object') {
        setIsSaved(user.savedItems.some(item => item._id === id));
      } else {
        setIsSaved(user.savedItems.includes(id));
      }
    }

    if (user) {
      axios.get(`http://localhost:5000/claims/item/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setClaims(res.data)).catch(err => console.error(err));
    }
  }, [id, user]);

  const handleUpdateClaim = async (claimId, status) => {
    try {
      await axios.patch(`http://localhost:5000/claims/${claimId}`, { status }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setClaims(claims.map(c => c._id === claimId ? { ...c, status } : c));
      toast.success(`Claim marked as ${status}`);
    } catch (e) {
      toast.error('Failed to update claim');
    }
  };

  const handleSendMessage = async (claimId) => {
    if (!chatMessage.trim()) return;
    try {
      const { data } = await axios.post(`http://localhost:5000/claims/${claimId}/message`, {
        text: chatMessage,
        senderId: user._id
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setClaims(claims.map(c => c._id === claimId ? data : c));
      setChatMessage('');
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const toggleSave = async () => {
    if (!user) return toast.error("Please log in to save items");
    try {
      const res = await axios.post(`http://localhost:5000/users/save/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIsSaved(res.data.savedItems.includes(id));
      toast.success(isSaved ? "Item removed from saved" : "Item saved!");
    } catch(e) {
      toast.error("Failed to save item");
    }
  };

  const submitClaim = async () => {
    if(!user) return toast.error("Please log in to claim items");
    if(!claimText.trim()) return toast.error("Proof is required to claim!");
    setClaiming(true);
    const toastId = toast.loading("Submitting Security Claim...");
    try {
      await createClaim({ itemId: item._id, userId: user._id, proofMessage: claimText });
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
            {item.status === 'lost' ? 'Reported Lost 🔴' : item.status === 'claimed' ? 'Claimed ✅' : 'Reported Found 🟢'}
          </span>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="detail-no-img"><Box size={64}/></div>}
        </motion.div>
        
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="detail-info-box card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1>{item.title}</h1>
            <button 
              onClick={toggleSave}
              className={`button icon-button ${isSaved ? 'saved' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#3b82f6' : '#9ca3af' }}
            >
              <Bookmark size={24} fill={isSaved ? '#3b82f6' : 'none'} />
            </button>
          </div>
          <div className="meta-info">Reported by {item.userId?.name || 'Anonymous'} • {new Date(item.createdAt).toLocaleDateString()}</div>
          {item.location && <div className="meta-info location-info mt-2" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280' }}><MapPin size={16}/> {item.location}</div>}
          
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

          {(!user || user._id !== item.userId?._id) && item.status === 'found' && !claims.some(c => c.userId?._id === user?._id) && (
            <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
               className="btn-primary claim-trigger mt-4"
               onClick={() => setClaimModal(true)}
            >
               <ShieldCheck size={20}/> Ensure Claim Ownership
            </motion.button>
          )}
        </motion.div>
      </div>

      {user && (
        <div className="claims-section card mt-4" style={{ padding: '2rem' }}>
          <h2>Claims & Chat</h2>
          {claims.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No claims active for this item.</p>
          ) : (
            claims.filter(c => user._id === item.userId?._id || user._id === c.userId?._id).map((claim, idx) => (
              <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Claim by {claim.userId?.name || 'Unknown'}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{new Date(claim.createdAt).toLocaleString()}</span>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>"{claim.proofMessage}"</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-badge ${claim.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem' }}>Status: {claim.status.toUpperCase()}</span>
                    
                    {user._id === item.userId?._id && claim.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleUpdateClaim(claim._id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleUpdateClaim(claim._id, 'rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Reject</button>
                      </div>
                    )}
                    {user._id === item.userId?._id && claim.status === 'approved' && (
                      <button onClick={() => handleUpdateClaim(claim._id, 'completed')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>Mark Completed</button>
                    )}
                  </div>
                </div>

                {['approved', 'pending', 'completed'].includes(claim.status) && (
                  <div className="chat-box" style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.5rem' }}>
                      {(!claim.messages || claim.messages.length === 0) ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem 0' }}>No messages yet. Say hi!</div>
                      ) : (
                        claim.messages.map((msg, i) => (
                          <div key={i} style={{ 
                            alignSelf: msg.sender?._id === user._id ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender?._id === user._id ? 'flex-end' : 'flex-start'
                          }}>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 4px 2px 4px' }}>
                              {msg.sender?.name} • {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div style={{ 
                              background: msg.sender?._id === user._id ? '#3b82f6' : '#ffffff', 
                              color: msg.sender?._id === user._id ? '#ffffff' : '#1f2937',
                              padding: '8px 12px', 
                              borderRadius: '16px', 
                              borderBottomRightRadius: msg.sender?._id === user._id ? '4px' : '16px',
                              borderBottomLeftRadius: msg.sender?._id !== user._id ? '4px' : '16px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              border: msg.sender?._id !== user._id ? '1px solid #e5e7eb' : 'none',
                              wordBreak: 'break-word',
                              fontSize: '0.9rem'
                             }}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      {/* Auto-scroll target */}
                      <div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }}></div>
                    </div>
                    {claim.status !== 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={chatMessage} 
                          onChange={e => setChatMessage(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(claim._id)} 
                          placeholder="Type a message..." 
                          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '24px', border: '1px solid #d1d5db', outline: 'none' }} 
                        />
                        <button 
                          onClick={() => handleSendMessage(claim._id)} 
                          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '24px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
                        >Send</button>
                      </div>
                    )}
                    
                    {claim.status === 'completed' && user._id === claim.userId?._id && (
                      <div className="feedback-box mt-4" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Rate your experience!</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="number" min="1" max="5" placeholder="Rating (1-5)" id="rating-input" style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}/>
                          <input type="text" placeholder="Leave a comment (optional)" id="comment-input" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}/>
                          <button onClick={async () => {
                            const r = document.getElementById('rating-input').value;
                            const c = document.getElementById('comment-input').value;
                            if(!r) return toast.error("Rating is required");
                            try {
                              await axios.post('http://localhost:5000/feedback', { rating: r, comment: c, claimId: claim._id }, { headers: { Authorization: `Bearer ${user.token}` } });
                              toast.success("Thanks for your feedback!");
                            } catch(e) { toast.error("Failed to submit feedback"); }
                          }} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Submit Feedback</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

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
                 <button 
                   onClick={() => setClaimModal(false)}
                   style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                 >Cancel</button>
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
