import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Search, Home as HomeIcon } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

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
          <Link to="/add" className={`nav-link btn-publish ${location.pathname === '/add' ? 'active' : ''}`}>
             <PlusCircle size={20} /> Report Item
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
