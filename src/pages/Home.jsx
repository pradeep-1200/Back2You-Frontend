import React, { useEffect, useState } from 'react';
import { getItems, searchItems, getTrendingTags, getRecentActivity } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheck, Zap, Crosshair } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import './Home.css';
import './HomeSidebar.css';

const Home = () => {
  const [items, setItems] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(() => {
      // Background poll: doesn't set loading to true
      Promise.all([
        getItems(),
        getTrendingTags(),
        getRecentActivity()
      ]).then(([itemsRes, trendRes, actRes]) => {
        setItems(prev => searchActive ? prev : itemsRes.data);
        setTrending(trendRes.data);
        setActivity(actRes.data);
      }).catch(() => {});
    }, 60000); // 60s poll
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [itemsRes, trendRes, actRes] = await Promise.all([
        getItems(),
        getTrendingTags(),
        getRecentActivity()
      ]);
      setItems(itemsRes.data);
      setTrending(trendRes.data);
      setActivity(actRes.data);
    } catch (e) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams) => {
    setLoading(true);
    try {
      // searchParams can be string from trending tags, or object from search bar
      const params = typeof searchParams === 'string' ? { query: searchParams } : searchParams;

      if (!params.query?.trim() && !params.location && !params.status && !params.date) {
        setSearchActive(false);
        const { data } = await getItems();
        setItems(data);
      } else {
        setSearchActive(true);
        const { data } = await searchItems(params);
        setItems(data);
        toast.success(`Found ${data.length} matches!`, { icon: '🔍' });
      }
    } catch (e) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="container home-container"
    >
      <motion.div 
         initial={{ y: -30, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="hero-title">
          Find What You Lost. Return What You Found.
        </h1>
        <p className="hero-sub">
          A smart digital lost & found platform
        </p>
      </motion.div>

      <div className="search-container">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Trending Tags Section */}
      {trending.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="trending-section">
          <span className="trending-title">Trending Searches:</span>
          {trending.map((tag, i) => (
            <motion.span 
              key={i} 
              whileHover={{ scale: 1.05 }}
              className="tag"
              onClick={() => handleSearch(tag)}
            >
              #{tag}
            </motion.span>
          ))}
        </motion.div>
      )}

      <div className="main">
        <div className="main-feed">
          {loading ? (
             <div className="items-grid">
               {[1,2,3,4].map(n => <div key={n} className="skeleton-card card"></div>)}
             </div>
          ) : (
            <AnimatePresence>
              {items.length === 0 ? (
                <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }} 
                   animate={{ scale: 1, opacity: 1 }}
                   className="empty-state card"
                >
                  <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" className="empty-illustration"/>
                  <h3>Looks like nothing here 👀</h3>
                  <p>Try searching something else or browse the recent feed.</p>
                  <button onClick={() => fetchInitialData()} className="button empty-btn">Reload Feed</button>
                </motion.div>
              ) : (
                <motion.div layout className="items-grid">
                  <AnimatePresence>
                    {items.map(item => (
                      <ItemCard key={item._id} item={item} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Sidebar: Recent Activity & Features */}
        <div className="home-sidebar">
          <div className="card sidebar-widget activity-feed">
            <h3>Live Activity</h3>
            {activity.map((act, i) => (
              <motion.div 
                key={act._id} 
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="activity-item"
              >
                <div className={`activity-dot dot-${act.status}`}></div>
                <div className="activity-text">
                  <p>{act.message}</p>
                  <small>{new Date(act.createdAt).toLocaleTimeString()}</small>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="card sidebar-widget features-widget">
            <h3>Why Back2You?</h3>
            <ul className="features-list">
              <li><Zap className="feature-icon" color="#6366f1"/> <span><b>Smart Matching:</b> AI algorithm scores similarities instantly.</span></li>
              <li><ShieldCheck className="feature-icon" color="#10b981"/> <span><b>Secure Claims:</b> Proof-based claiming protects belongings.</span></li>
              <li><Crosshair className="feature-icon" color="#3b82f6"/> <span><b>Fuzzy Search:</b> Find it faster using tags and colors.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
