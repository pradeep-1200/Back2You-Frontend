import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Home as HomeIcon, User, Bell, LogOut, Shield, Menu, X, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    let interval;
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await axios.get('http://localhost:5000/notifications', {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          setNotifications(res.data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchNotifs();
      interval = setInterval(fetchNotifs, 60000);
    }
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => handleRead(n._id)));
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const trustTone = (score = 0) => {
    if (score >= 80) return 'trusted';
    if (score >= 40) return 'neutral';
    return 'risky';
  };

  const adminActive = location.pathname.startsWith('/admin');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">B2Y</span> Back2You
        </Link>

        <div className="nav-menu desktop-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <HomeIcon size={18} /> Home
          </Link>
          <Link to="/add" className={`nav-link btn-publish ${location.pathname === '/add' ? 'active' : ''}`}>
            <PlusCircle size={18} /> Report Item
          </Link>

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${adminActive ? 'active' : ''}`}>
                  <Shield size={18} /> Admin
                </Link>
              )}
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="notif-btn"
                  onClick={() => setShowNotifs(!showNotifs)}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>

                {showNotifs && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button className="mark-all-btn" onClick={markAllRead}>
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">
                          <Bell size={28} style={{ opacity: 0.3 }} />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`notif-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleRead(n._id)}
                          >
                            <div className="notif-dot" style={{ background: n.read ? 'transparent' : '#0f766e' }} />
                            <div className="notif-body">
                              <p>{n.message}</p>
                              <span className="notif-time">{timeAgo(n.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                <User size={18} /> {user.name}
              </Link>
              <span className={`trust-pill ${trustTone(user.trustScore)}`}>
                Trust {user.trustScore ?? 0}
              </span>
              <button onClick={logout} className="nav-link icon-btn logout-btn">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-link btn-publish signup-btn">Sign Up</Link>
            </>
          )}
        </div>

        <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-nav">
          <Link to="/" className="mobile-nav-link">Home</Link>
          <Link to="/add" className="mobile-nav-link">Report Item</Link>
          {user ? (
            <>
              {user.role === 'admin' && <Link to="/admin" className="mobile-nav-link">Admin</Link>}
              <div className="mobile-nav-link">Trust: {user.trustScore ?? 0}</div>
              <Link to="/profile" className="mobile-nav-link">Profile</Link>
              <button onClick={logout} className="mobile-nav-link mobile-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link">Log In</Link>
              <Link to="/signup" className="mobile-nav-link">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
