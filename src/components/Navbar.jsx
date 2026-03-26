import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Search, Home as HomeIcon, User, Bell, LogOut, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    let interval;
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await axios.get('http://localhost:5000/notifications', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          setNotifications(res.data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchNotifs();
      interval = setInterval(fetchNotifs, 10000); // 10s poll
    }
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🔁</span> Back2You
        </Link>
        <div className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
             <HomeIcon size={20} /> Home
          </Link>
          <Link to="/stats" className={`nav-link ${location.pathname === '/stats' ? 'active' : ''}`}>
             <BarChart2 size={20} /> Stats
          </Link>
          <Link to="/add" className={`nav-link btn-publish ${location.pathname === '/add' ? 'active' : ''}`}>
             <PlusCircle size={20} /> Report Item
          </Link>
          
          {user ? (
            <>
              <div className="notif-wrapper" style={{ position: 'relative' }}>
                <button 
                  className="nav-link icon-btn" 
                  onClick={() => setShowNotifs(!showNotifs)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="notif-dropdown" style={{ 
                    position: 'absolute', right: 0, top: '40px', background: '#fff', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', 
                    width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 100 
                  }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} onClick={() => handleRead(n._id)} style={{ 
                          padding: '1rem', borderBottom: '1px solid #eee', cursor: 'pointer',
                          background: n.read ? '#fff' : '#f0fdf4' 
                        }}>
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                <User size={20} /> {user.name}
              </Link>
              <button onClick={logout} className="nav-link icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-link btn-publish" style={{ backgroundColor: '#2563eb', color: '#fff' }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
