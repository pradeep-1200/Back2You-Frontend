import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Shield, Users, Boxes, FileCheck2, Activity } from 'lucide-react';
import { BACKEND_URL } from '../config';
import './AdminDashboard.css';

const API_URL = `${BACKEND_URL}/admin`;
const PAGE_SIZE = 6;

const tabConfig = [
  { key: 'stats', label: 'Overview', icon: Shield, path: '/admin/stats' },
  { key: 'items', label: 'Items', icon: Boxes, path: '/admin/items' },
  { key: 'claims', label: 'Claims', icon: FileCheck2, path: '/admin/claims' },
  { key: 'users', label: 'Users', icon: Users, path: '/admin/users' },
];

const trustTone = (score = 0) => {
  if (score >= 80) return 'trusted';
  if (score >= 40) return 'neutral';
  return 'risky';
};

const AdminDashboard = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const activeTab = (() => {
    if (location.pathname === '/admin') return 'stats';
    if (location.pathname.startsWith('/admin/items')) return 'items';
    if (location.pathname.startsWith('/admin/claims')) return 'claims';
    if (location.pathname.startsWith('/admin/users')) return 'users';
    return 'stats';
  })();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [statsRes, itemsRes, claimsRes, usersRes, activityRes] = await Promise.all([
          axios.get(`${API_URL}/stats`, config),
          axios.get(`${API_URL}/items`, config),
          axios.get(`${API_URL}/claims`, config),
          axios.get(`${API_URL}/users`, config),
          axios.get(`${API_URL}/activity`, config),
        ]);
        setStats(statsRes.data);
        setItems(itemsRes.data);
        setClaims(claimsRes.data);
        setUsers(usersRes.data);
        setActivity(activityRes.data);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  }, [activeTab]);

  const config = { headers: { Authorization: `Bearer ${user?.token}` } };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item globally?')) return;
    try {
      await axios.delete(`${API_URL}/items/${id}`, config);
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success('Item deleted globally');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete item');
    }
  };

  const resolveItem = async (id) => {
    try {
      await axios.patch(`${API_URL}/items/${id}/resolve`, {}, config);
      setItems((prev) => prev.map((item) => (
        item._id === id ? { ...item, status: 'resolved' } : item
      )));
      toast.success('Item marked as resolved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resolve item');
    }
  };

  const updateClaimStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/claims/${id}`, { status }, config);
      setClaims((prev) => prev.map((claim) => (
        claim._id === id ? { ...claim, status } : claim
      )));
      if (status === 'approved') {
        setItems((prev) => prev.map((item) => (
          item._id === claims.find((claim) => claim._id === id)?.itemId?._id
            ? { ...item, status: 'resolved' }
            : item
        )));
      }
      toast.success(`Claim ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update claim');
    }
  };

  const toggleBanUser = async (id, currentStatus) => {
    try {
      const { data } = await axios.patch(`${API_URL}/users/${id}/ban`, { isBanned: !currentStatus }, config);
      setUsers((prev) => prev.map((entry) => (entry._id === id ? data.user : entry)));
      if (id === user._id) updateUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const promoteUser = async (id, role) => {
    try {
      const { data } = await axios.patch(`${API_URL}/users/${id}/role`, { role }, config);
      setUsers((prev) => prev.map((entry) => (entry._id === id ? data.user : entry)));
      if (id === user._id) updateUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const query = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch = !query || [item.title, item.userId?.name, item.status].some((value) => value?.toLowerCase().includes(query));
    const matchesFilter = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesFilter;
  });
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = !query || [claim.itemId?.title, claim.userId?.name, claim.status].some((value) => value?.toLowerCase().includes(query));
    const matchesFilter = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesFilter;
  });
  const filteredUsers = users.filter((entry) => {
    const matchesSearch = !query || [entry.name, entry.email, entry.role, entry.trustLevel].some((value) => value?.toLowerCase().includes(query));
    const userState = entry.isBanned ? 'banned' : 'active';
    const matchesFilter = statusFilter === 'all' || userState === statusFilter || entry.role === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const paginatedRows = (rows) => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = (rows) => Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentRows = activeTab === 'items'
    ? paginatedRows(filteredItems)
    : activeTab === 'claims'
      ? paginatedRows(filteredClaims)
      : paginatedRows(filteredUsers);

  const renderOverviewCard = (title, item, accent) => (
    <div className="admin-stat-card" key={title}>
      <div className="admin-stat-card__title">{title}</div>
      <div className="admin-stat-card__value">{item?.value ?? 0}</div>
      <div className={`admin-stat-card__trend ${(item?.delta ?? 0) >= 0 ? 'up' : 'down'}`}>
        <span>{(item?.delta ?? 0) >= 0 ? '↑' : '↓'}</span> {Math.abs(item?.delta ?? 0)} vs prev window
      </div>
      <div className="admin-stat-card__accent" style={{ background: accent }} />
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div>
            <p className="admin-kicker">Moderation</p>
            <h1>Control Center</h1>
            <p className="admin-subtitle">Manage platform integrity, trust, and recovery flow from one place.</p>
          </div>

          <div className="admin-tabs">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link key={tab.key} to={tab.path} className={`admin-tab-link ${activeTab === tab.key ? 'active' : ''}`}>
                  <Icon size={18} /> {tab.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="admin-content-panel">
          {loading ? (
            <div className="admin-loading">Loading moderation data...</div>
          ) : (
            <>
              {(activeTab === 'stats') && (
                <>
                  <div className="admin-overview-grid">
                    {renderOverviewCard('Total Items', stats?.overview?.totalItems, 'linear-gradient(135deg, #0f766e, #14b8a6)')}
                    {renderOverviewCard('Lost Items', stats?.overview?.lostItems, 'linear-gradient(135deg, #b91c1c, #ef4444)')}
                    {renderOverviewCard('Found Items', stats?.overview?.foundItems, 'linear-gradient(135deg, #166534, #22c55e)')}
                    {renderOverviewCard('Active Users', stats?.overview?.activeUsers, 'linear-gradient(135deg, #1d4ed8, #60a5fa)')}
                    {renderOverviewCard('Total Claims', stats?.overview?.totalClaims, 'linear-gradient(135deg, #92400e, #f59e0b)')}
                  </div>

                  <div className="admin-overview-sections">
                    <div className="admin-card">
                      <div className="admin-card__header">
                        <h2>Platform Snapshot</h2>
                        <span>Last 7 days</span>
                      </div>
                      <div className="admin-week-grid">
                        <div><strong>{stats?.weekActivity?.totalItems ?? 0}</strong><span>Items created</span></div>
                        <div><strong>{stats?.weekActivity?.lostItems ?? 0}</strong><span>Lost reports</span></div>
                        <div><strong>{stats?.weekActivity?.foundItems ?? 0}</strong><span>Found reports</span></div>
                        <div><strong>{stats?.weekActivity?.activeUsers ?? 0}</strong><span>Active users</span></div>
                        <div><strong>{stats?.weekActivity?.totalClaims ?? 0}</strong><span>Claims raised</span></div>
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card__header">
                        <h2>Recent Moderation Actions</h2>
                        <Activity size={16} />
                      </div>
                      <div className="admin-activity-list">
                        {activity.length === 0 ? (
                          <p className="admin-empty-inline">No moderation actions yet.</p>
                        ) : activity.map((entry) => (
                          <div key={entry._id} className="admin-activity-item">
                            <div>
                              <strong>{entry.action.replaceAll('_', ' ')}</strong>
                              <p>{entry.details || `Target: ${entry.targetType}`}</p>
                            </div>
                            <span>{new Date(entry.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab !== 'stats' && (
                <>
                  <div className="admin-toolbar">
                    <div className="admin-toolbar__search">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        placeholder={`Search ${activeTab}`}
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="admin-filter"
                    >
                      <option value="all">All</option>
                      {activeTab === 'items' && (
                        <>
                          <option value="lost">Lost</option>
                          <option value="found">Found</option>
                          <option value="resolved">Resolved</option>
                        </>
                      )}
                      {activeTab === 'claims' && (
                        <>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="completed">Completed</option>
                        </>
                      )}
                      {activeTab === 'users' && (
                        <>
                          <option value="active">Active</option>
                          <option value="banned">Banned</option>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="admin-table-card">
                    <table className="admin-table">
                      {activeTab === 'items' && (
                        <>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Status</th>
                              <th>User</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRows.map((item) => (
                              <tr key={item._id}>
                                <td>{item.title}</td>
                                <td><span className={`admin-status ${item.status}`}>{item.status}</span></td>
                                <td>{item.userId?.name || 'Unknown'}</td>
                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="admin-actions">
                                  <button className="admin-btn warning" onClick={() => resolveItem(item._id)}>Resolve</button>
                                  <button className="admin-btn danger" onClick={() => deleteItem(item._id)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                      {activeTab === 'claims' && (
                        <>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Claimer</th>
                              <th>Status</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRows.map((claim) => (
                              <tr key={claim._id}>
                                <td>{claim.itemId?.title || 'Unknown item'}</td>
                                <td>{claim.userId?.name || 'Unknown'}</td>
                                <td><span className={`admin-status ${claim.status}`}>{claim.status}</span></td>
                                <td>{new Date(claim.createdAt).toLocaleDateString()}</td>
                                <td className="admin-actions">
                                  {claim.status === 'pending' ? (
                                    <>
                                      <button className="admin-btn success" onClick={() => updateClaimStatus(claim._id, 'approved')}>Approve</button>
                                      <button className="admin-btn danger" onClick={() => updateClaimStatus(claim._id, 'rejected')}>Reject</button>
                                    </>
                                  ) : (
                                    <span className="admin-muted">No actions</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}

                      {activeTab === 'users' && (
                        <>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Trust</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRows.map((entry) => (
                              <tr key={entry._id}>
                                <td>{entry.name}</td>
                                <td>{entry.email}</td>
                                <td>{entry.role}</td>
                                <td>{entry.isBanned ? 'Banned' : 'Active'}</td>
                                <td>
                                  <span className={`admin-trust ${trustTone(entry.trustScore)}`}>
                                    {entry.trustScore} • {entry.trustLevel}
                                  </span>
                                </td>
                                <td className="admin-actions">
                                  <button className={`admin-btn ${entry.isBanned ? 'success' : 'danger'}`} onClick={() => toggleBanUser(entry._id, entry.isBanned)}>
                                    {entry.isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                  {entry.role !== 'admin' ? (
                                    <button className="admin-btn neutral" onClick={() => promoteUser(entry._id, 'admin')}>Promote</button>
                                  ) : (
                                    <button className="admin-btn neutral" onClick={() => promoteUser(entry._id, 'user')}>Demote</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )}
                    </table>

                    {currentRows.length === 0 && (
                      <div className="admin-empty-inline">No records match your current filters.</div>
                    )}
                  </div>

                  <div className="admin-pagination">
                    <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>Previous</button>
                    <span>Page {page} of {activeTab === 'items' ? totalPages(filteredItems) : activeTab === 'claims' ? totalPages(filteredClaims) : totalPages(filteredUsers)}</span>
                    <button
                      onClick={() => setPage((prev) => Math.min(activeTab === 'items' ? totalPages(filteredItems) : activeTab === 'claims' ? totalPages(filteredClaims) : totalPages(filteredUsers), prev + 1))}
                      disabled={page === (activeTab === 'items' ? totalPages(filteredItems) : activeTab === 'claims' ? totalPages(filteredClaims) : totalPages(filteredUsers))}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
