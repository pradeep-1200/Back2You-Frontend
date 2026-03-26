import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import MatchCard from '../components/MatchCard';
import './Form.css';

const AddItem = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ title: '', description: '', tags: '', status: 'lost' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topMatches, setTopMatches] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!data.title) return toast.error("Title is required!");
    setLoading(true);
    const toastId = toast.loading("Analyzing & Reporting Item...");
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach(k => formData.append(k, data[k]));
      formData.append('userId', '60b8d295f1d4f4001550c822'); 
      if (image) formData.append('image', image);

      const res = await createItem(formData);
      
      if (res.data.matchCount > 0) {
         toast.success(`Reported! Found ${res.data.matchCount} potential matches.`, { id: toastId });
         setTopMatches(res.data.item.matches.slice(0, 3)); // show top 3
      } else {
         toast.success("Item successfully reported!", { id: toastId });
         setTimeout(() => navigate('/'), 1000);
      }
    } catch (e) {
      toast.error('Failed to report item', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="form-wrapper">
      <div className="form-container card">
        <div className="form-header">
           <h2 className="page-title">Report New Entry</h2>
           <p className="subtitle">Our algorithm will instantly scan for matches.</p>
        </div>

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="toggle-group form-input" style={{padding: '0.5rem', display:'flex', gap:'0.5rem'}}>
            <motion.div className={`toggle ${data.status === 'lost' ? 'active-lost' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => setData({...data, status:'lost'})}>
              😞 Lost Something
            </motion.div>
            <motion.div className={`toggle ${data.status === 'found' ? 'active-found' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => setData({...data, status:'found'})}>
              😇 Found Something
            </motion.div>
          </div>
          
          <input className="form-input" required placeholder="Short Title (e.g. Leather Wallet)" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          <textarea className="form-input" rows="4" required placeholder="Description (Location, Time, Distinctive Marks)..." value={data.description} onChange={e => setData({...data, description: e.target.value})} />
          <input className="form-input" placeholder="Tags (comma separated e.g. wallet, brown, campus)" value={data.tags} onChange={e => setData({...data, tags: e.target.value})} />

          <label className="upload-box form-input">
            <input type="file" accept="image/*" onChange={(e) => {
               if(e.target.files[0]) { setImage(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); }
            }} style={{display:'none'}} />
            {preview ? (
              <div className="preview-wrap">
                 <img src={preview} alt="Upload preview" className="image-preview" />
                 <span className="upload-change-text">Click to change</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={32} color="var(--primary-color)" style={{marginBottom:'0.5rem'}}/>
                <span>Drag & Drop image here</span>
              </div>
            )}
          </label>
          
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary form-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Submit & Check Matches'}
          </motion.button>
        </form>
      </div>

      <AnimatePresence>
        {topMatches.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="modal-content card match-modal">
               <button className="close-btn" onClick={() => navigate('/')}><X/></button>
               <h2 style={{color:'#a855f7', marginBottom:'0.5rem'}}>🔥 Immediate Matches Found!</h2>
               <p style={{marginBottom:'1.5rem', color:'var(--text-secondary)'}}>Review these items before creating another report.</p>
               
               <div className="matches-feed" style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                 {topMatches.map((m, i) => <MatchCard key={i} matchInfo={m}/>)}
               </div>

               <button className="btn-primary" style={{marginTop:'2rem', width:'100%'}} onClick={() => navigate('/')}>Return to Timeline</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default AddItem;
