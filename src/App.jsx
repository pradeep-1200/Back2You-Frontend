import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Toaster position="top-center" toastOptions={{ 
            style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } 
        }} />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddItem />} />
            <Route path="/item/:id" element={<ItemDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
