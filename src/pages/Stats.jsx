import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Activity, Users, FileText, CheckCircle } from 'lucide-react';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="stats-container">Loading analytics...</div>;

  return (
    <div className="stats-container">
      <div className="stats-header">
        <PieChart size={32} className="text-blue-500" />
        <h2>Platform Analytics Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <FileText size={40} className="stats-icon text-gray" />
          <div className="stats-info">
            <h3>{stats.totalItems}</h3>
            <p>Total Items Reported</p>
          </div>
        </div>
        <div className="stats-card">
          <Activity size={40} className="stats-icon text-red" />
          <div className="stats-info">
            <h3>{stats.lostItems}</h3>
            <p>Lost Items</p>
          </div>
        </div>
        <div className="stats-card">
          <CheckCircle size={40} className="stats-icon text-green" />
          <div className="stats-info">
            <h3>{stats.foundItems}</h3>
            <p>Found Items</p>
          </div>
        </div>
        <div className="stats-card">
          <Users size={40} className="stats-icon text-blue" />
          <div className="stats-info">
            <h3>{stats.totalUsers}</h3>
            <p>Registered Users</p>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Trending Tags</h3>
        <div className="tags-bar-chart">
          {stats.mostUsedTags.map(tag => (
            <div key={tag.tag} className="tag-bar-wrap">
              <span className="tag-label">{tag.tag}</span>
              <div className="tag-bar-bg">
                <div 
                  className="tag-bar-fill" 
                  style={{ width: `${(tag.count / stats.mostUsedTags[0].count) * 100}%` }}
                ></div>
              </div>
              <span className="tag-count">{tag.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section align-center text-center smart-empty">
        <img src="https://cdni.iconscout.com/illustration/premium/thumb/analytics-dashboard-4468600-3728639.png" alt="Analytics" width="150" />
        <h4>Data empowers decisions</h4>
        <p>Our intelligent system continues to learn from user reports and interactions to provide better matches.</p>
      </div>
    </div>
  );
};

export default Stats;
