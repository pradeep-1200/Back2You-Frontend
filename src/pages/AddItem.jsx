import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createItem, getItemById, updateItem } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ArrowLeft } from 'lucide-react';
import MatchCard from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import './Form.css';

const buildFormState = (item) => ({
  title: item.title || '',
  description: item.description || '',
  tags: item.tags?.join(', ') || '',
  location: item.location || '',
  status: item.status || 'lost',
});

const AddItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);
  const prefetchedItem = location.state?.item;
  const { user } = useAuth();
  const emptyForm = useMemo(
    () => ({ title: '', description: '', tags: '', location: '', status: 'lost' }),
    []
  );
  const [data, setData] = useState(prefetchedItem ? buildFormState(prefetchedItem) : emptyForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(prefetchedItem?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing && !prefetchedItem);
  const [topMatches, setTopMatches] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isEditing]);

  useEffect(() => {
    if (prefetchedItem && isEditing) {
      setData(buildFormState(prefetchedItem));
      setPreview(prefetchedItem.imageUrl || null);
      setImage(null);
      setPageLoading(false);
      return;
    }

    if (!isEditing) {
      setData(emptyForm);
      setPreview(null);
      setImage(null);
      setPageLoading(false);
    }
  }, [emptyForm, isEditing, prefetchedItem]);

  useEffect(() => {
    if (!isEditing || prefetchedItem) return;

    getItemById(editId)
      .then(({ data: item }) => {
        setData(buildFormState(item));
        if (item.imageUrl) setPreview(item.imageUrl);
      })
      .catch((error) => toast.error(error.response?.data?.error || 'Failed to load item for editing'))
      .finally(() => setPageLoading(false));
  }, [editId, isEditing, prefetchedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.title.trim()) return toast.error("Title is required!");
    setLoading(true);
    const toastId = toast.loading(isEditing ? "Updating report..." : "Analyzing & Reporting Item...");

    try {
      if (!user) {
        return toast.error("Please log in to report an item");
      }

      const formData = new FormData();
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
      formData.append('userId', user._id);
      if (image) formData.append('image', image);

      const res = isEditing
        ? await updateItem(editId, formData)
        : await createItem(formData);

      if (isEditing) {
        toast.success("Item updated successfully!", { id: toastId });
        setTimeout(() => navigate('/profile'), 350);
      } else if (res.data.matchCount > 0) {
        toast.success(`Reported! Found ${res.data.matchCount} potential matches.`, { id: toastId });
        setTopMatches(res.data.item.matches.slice(0, 3));
      } else {
        toast.success("Item successfully reported!", { id: toastId });
        setTimeout(() => navigate('/'), 900);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || error.message || (isEditing ? 'Failed to update item' : 'Failed to report item'),
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="form-wrapper"><div className="form-container card">Loading item...</div></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="form-wrapper">
      <div className="form-container card">
        <div className="form-topbar">
          {isEditing && (
            <button
              type="button"
              className="form-back-btn"
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft size={16} /> Back to Profile
            </button>
          )}
          {isEditing && <span className="form-mode-badge">Editing existing report</span>}
        </div>

        <div className="form-header">
          <h2 className="page-title">{isEditing ? 'Edit Report Item' : 'Report New Entry'}</h2>
          <p className="subtitle">{isEditing ? 'Update the report and save changes.' : 'Our algorithm will instantly scan for matches.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="toggle-group form-input" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <motion.div className={`toggle ${data.status === 'lost' ? 'active-lost' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => setData({ ...data, status: 'lost' })}>
              Lost Something
            </motion.div>
            <motion.div className={`toggle ${data.status === 'found' ? 'active-found' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => setData({ ...data, status: 'found' })}>
              Found Something
            </motion.div>
          </div>

          <input className="form-input" required placeholder="Short Title (e.g. Leather Wallet)" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
          <textarea className="form-input" rows="4" required placeholder="Description (Location, Time, Distinctive Marks)..." value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
          <input className="form-input" placeholder="Location where it was lost/found" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} />
          <input className="form-input" placeholder="Tags (comma separated e.g. wallet, brown, campus)" value={data.tags} onChange={(e) => setData({ ...data, tags: e.target.value })} />

          <label className="upload-box form-input">
            <input type="file" accept="image/*" onChange={(e) => {
              if (e.target.files[0]) {
                setImage(e.target.files[0]);
                setPreview(URL.createObjectURL(e.target.files[0]));
              }
            }} style={{ display: 'none' }} />
            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="Upload preview" className="image-preview" />
                <span className="upload-change-text">Click to change</span>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={32} color="var(--primary-color)" style={{ marginBottom: '0.5rem' }} />
                <span>Drag & Drop image here</span>
              </div>
            )}
          </label>

          <div className="form-action-row">
            {isEditing && (
              <button type="button" className="form-secondary-btn" onClick={() => navigate('/profile')}>
                Cancel
              </button>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary form-btn" disabled={loading}>
              {loading ? 'Processing...' : isEditing ? 'Update Item' : 'Submit & Check Matches'}
            </motion.button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {!isEditing && topMatches.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="modal-content card match-modal">
              <button className="close-btn" onClick={() => navigate('/')}><X /></button>
              <h2 style={{ color: '#a855f7', marginBottom: '0.5rem' }}>Immediate Matches Found!</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Review these items before creating another report.</p>

              <div className="matches-feed" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topMatches.map((m, i) => <MatchCard key={i} matchInfo={m} />)}
              </div>

              <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => navigate('/')}>Return to Timeline</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddItem;
