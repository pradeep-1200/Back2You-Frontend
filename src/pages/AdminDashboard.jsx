import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = "http://localhost:5000/admin";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  
  const [stats, setStats] = useState({ totalItems: 0, totalClaims: 0, activeUsers: 0 });
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      toast.error('Not authorized as admin');
      return;
    }
    fetchData();
  }, [user, navigate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (activeTab === 'stats') {
        const res = await axios.get(`${API_URL}/stats`, config);
        setStats(res.data);
      } else if (activeTab === 'items') {
        const res = await axios.get(`${API_URL}/items`, config);
        setItems(res.data);
      } else if (activeTab === 'claims') {
        const res = await axios.get(`${API_URL}/claims`, config);
        setClaims(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get(`${API_URL}/users`, config);
        setUsers(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch admin data');
    }
    setLoading(false);
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/item/${id}`, config);
      toast.success('Item deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const updateClaimStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${API_URL}/claim/${id}`, { status }, config);
      toast.success(`Claim ${status} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update claim');
    }
  };

  const toggleBanUser = async (id, currentStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.patch(`${API_URL}/user/${id}/ban`, { isBanned: !currentStatus }, config);
      toast.success(`User ${!currentStatus ? 'banned' : 'unbanned'} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user ban status');
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="subtitle">Manage items, claims, and users</p>

      <div className="admin-dashboard">
        <div className="admin-sidebar">
          <button 
            className={activeTab === 'stats' ? 'active' : ''} 
            onClick={() => setActiveTab('stats')}
          >
            📊 Stats Overview
          </button>
          <button 
            className={activeTab === 'items' ? 'active' : ''} 
            onClick={() => setActiveTab('items')}
          >
            📦 Items Management
          </button>
          <button 
            className={activeTab === 'claims' ? 'active' : ''} 
            onClick={() => setActiveTab('claims')}
          >
            🤝 Claims Management
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            👥 Users Management
          </button>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="skeleton" style={{ height: '300px' }}></div>
          ) : (
            <>
              {activeTab === 'stats' && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>{stats.totalItems}</h3>
                    <p>Total Items</p>
                  </div>
                  <div className="stat-card">
                    <h3>{stats.totalClaims}</h3>
                    <p>Total Claims</p>
                  </div>
                  <div className="stat-card">
                    <h3>{stats.activeUsers}</h3>
                    <p>Active Users</p>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="admin-table-container">
                  {items.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h2>No items found.</h2>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Reported By</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item._id}>
                            <td>{item.title}</td>
                            <td>{item.status}</td>
                            <td>{item.userId?.name || 'Unknown'}</td>
                            <td>
                              <button onClick={() => deleteItem(item._id)} className="admin-btn-action admin-btn-danger">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'claims' && (
                <div className="admin-table-container">
                  {claims.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🤝</div>
                      <h2>No claims found.</h2>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Claimant</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map(claim => (
                          <tr key={claim._id}>
                            <td>{claim.item?.title || 'Unknown Item'}</td>
                            <td>{claim.claimant?.name || 'Unknown'}</td>
                            <td>{claim.status}</td>
                            <td>
                              {claim.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => updateClaimStatus(claim._id, 'approved')} className="admin-btn-action admin-btn-success">
                                    Approve
                                  </button>
                                  <button onClick={() => updateClaimStatus(claim._id, 'rejected')} className="admin-btn-action admin-btn-danger">
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="admin-table-container">
                  {users.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h2>No users found.</h2>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.isBanned ? 'Banned' : 'Active'}</td>
                            <td>
                              {u.role !== 'admin' && (
                                <button 
                                  onClick={() => toggleBanUser(u._id, u.isBanned)} 
                                  className={`admin-btn-action ${u.isBanned ? 'admin-btn-success' : 'admin-btn-danger'}`}
                                >
                                  {u.isBanned ? 'Unban' : 'Ban'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
