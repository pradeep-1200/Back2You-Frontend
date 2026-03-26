import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
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
        }
      };
      fetchData();
    }
  }, [user]);

  if (!user) return <div className="profile-container">Please log in to view profile.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="profile-gamification">
            <span className="points-badge">🏆 {user.points} Points</span>
            {user.points > 50 && <span className="top-helper">⭐ Top Helper</span>}
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
        {activeTab === 'items' && (
          <div className="item-list">
            {items.length === 0 ? <p className="empty-state">No items reported.</p> : items.map(item => (
              <div key={item._id} className="profile-card">
                <h4>{item.title}</h4>
                <span className={`status-badge ${item.status}`}>{item.status}</span>
                <p>{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'claims' && (
          <div className="item-list">
            {claims.length === 0 ? <p className="empty-state">No claims made.</p> : claims.map(claim => (
              <div key={claim._id} className="profile-card">
                <h4>{claim.itemId ? claim.itemId.title : 'Item deleted'}</h4>
                <div className="timeline">
                  <span className={`timeline-dot ${['requested', 'approved', 'completed'].includes(claim.status) ? 'active' : ''}`}>1. Requested</span>
                  <span className={`timeline-dot ${['approved', 'completed'].includes(claim.status) ? 'active' : ''}`}>2. Approved</span>
                  <span className={`timeline-dot ${claim.status === 'completed' ? 'active' : ''}`}>3. Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="item-list">
            {savedItems.length === 0 ? <p className="empty-state">No saved items.</p> : savedItems.map(item => (
              <div key={item._id} className="profile-card">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
