import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const [itemsRes, claimsRes, savedRes] = await Promise.all([
            axios.get(`http://localhost:5000/users/${user._id}/items`, config),
            axios.get(`http://localhost:5000/users/${user._id}/claims`, config),
            axios.get(`http://localhost:5000/users/saved`, config)
          ]);
          setItems(itemsRes.data);
          setClaims(claimsRes.data);
          setSavedItems(savedRes.data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  if (!user) return (
    <div className="profile-container">
      <div className="empty-state card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h3>Please log in to view your profile.</h3>
        <Link to="/login" className="button" style={{ marginTop: '1rem', display: 'inline-flex' }}>Log In</Link>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header card">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="profile-gamification">
            <span className="points-badge">🏆 {user.points || 0} Points</span>
            {(user.points || 0) > 50 && <span className="top-helper">⭐ Top Helper</span>}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>
          Reported Items ({items.length})
        </button>
        <button className={activeTab === 'claims' ? 'active' : ''} onClick={() => setActiveTab('claims')}>
          My Claims ({claims.length})
        </button>
        <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>
          Saved Items ({savedItems.length})
        </button>
      </div>

      <div className="profile-content">
        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'items' && (
              <div className="item-list">
                {items.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>No items reported yet.</h3>
                    <p>Start by reporting a lost or found item.</p>
                    <Link to="/add" className="button" style={{ marginTop: '1rem', display: 'inline-flex' }}>Report an Item</Link>
                  </div>
                ) : items.map(item => (
                  <Link key={item._id} to={`/item/${item._id}`} className="profile-card card" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{item.title}</h4>
                      <span className={`status-badge-sm status-${item.status}`}>{item.status}</span>
                    </div>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(item.createdAt).toLocaleDateString()} {item.location ? `• ${item.location}` : ''}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="item-list">
                {claims.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🤝</div>
                    <h3>No claims made yet.</h3>
                    <p>Browse found items and submit a claim for yours.</p>
                  </div>
                ) : claims.map(claim => (
                  <Link key={claim._id} to={`/item/${claim.itemId?._id}`} className="profile-card card" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0 0 10px', color: 'var(--text-primary)' }}>{claim.itemId?.title || 'Item deleted'}</h4>
                    <div className="timeline">
                      <span className={`timeline-dot ${['pending', 'approved', 'completed'].includes(claim.status) ? 'active' : ''}`}>1. Requested</span>
                      <span className={`timeline-dot ${['approved', 'completed'].includes(claim.status) ? 'active' : ''}`}>2. Approved</span>
                      <span className={`timeline-dot ${claim.status === 'completed' ? 'active' : ''}`}>3. Completed</span>
                    </div>
                    {claim.status === 'rejected' && (
                      <span style={{ display: 'inline-block', marginTop: '8px', background: '#fef2f2', color: '#ef4444', padding: '2px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>❌ Rejected</span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="item-list">
                {savedItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔖</div>
                    <h3>No saved items yet.</h3>
                    <p>Bookmark items to quickly come back to them.</p>
                  </div>
                ) : savedItems.map(item => (
                  <Link key={item._id} to={`/item/${item._id}`} className="profile-card card" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{item.title}</h4>
                      <span className={`status-badge-sm status-${item.status}`}>{item.status}</span>
                    </div>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
