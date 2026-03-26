import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestions } from '../services/api';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    onSearch(query);
  };

  const handleSuggestionClick = (sugg) => {
    setQuery(sugg);
    setShowSuggestions(false);
    onSearch(sugg);
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
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit" 
          className="button"
        >
          <Search size={18} /> Search
        </motion.button>
      </form>

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
