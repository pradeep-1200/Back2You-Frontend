import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestions } from '../services/api';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchSugg = async () => {
      if(query.trim().length > 1) {
        try {
          const { data } = await getSuggestions(query);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch(e) {}
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    
    const debounce = setTimeout(fetchSugg, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if(dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch({ query, location, date, category, status });
  };

  const handleSuggestionClick = (sugg) => {
    setQuery(sugg);
    setShowSuggestions(false);
    onSearch({ query: sugg, location, date, category, status });
  };

  return (
    <motion.div 
      ref={dropdownRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="search-container-wrapper"
    >
      <form onSubmit={handleSubmit} className="search-bar">
        <input 
          type="text" 
          placeholder="Search items, tags, colors..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
        />
        <input 
          type="text" 
          placeholder="Location..." 
          value={location} 
          onChange={e => setLocation(e.target.value)}
          style={{ borderLeft: '1px solid #eee', paddingLeft: '1rem' }}
        />
        <button 
          type="button" 
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderLeft: '1px solid #eee' }}
        >
          Filters
        </button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit" 
          className="button"
        >
          <Search size={18} /> Search
        </motion.button>
      </form>

      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="advanced-filters" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Any Status</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <select value={date} onChange={e => setDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Any Time</option>
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </motion.div>
      )}

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="suggestions-dropdown card"
          >
            {suggestions.map((sugg, i) => (
              <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(sugg)}>
                <Search size={14} style={{marginRight:'0.5rem', opacity:0.5}}/>
                {sugg}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchBar;
