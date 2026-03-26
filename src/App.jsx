import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import { useAuth } from './context/AuthContext';
import { SOCKET_URL } from './config';

let socket;

function App() {
  const { user } = useAuth();

  useEffect(() => {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    if (user && user._id) {
      socket.emit("setup", user);
    }

    socket.on("connected", () => {
      console.log("Socket connected for real-time features!");
    });

    socket.on("new notification", (notification) => {
      toast(notification.message, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    socket.on("claim message", () => {
      toast("New message about your claim", {
        icon: '💬',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <Router>
      <div className="app-container">
        <Toaster position="top-center" toastOptions={{
          style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }} />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<RequireAuth />}>
              <Route path="/add" element={<AddItem />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/stats" element={<AdminDashboard />} />
              <Route path="/admin/items" element={<AdminDashboard />} />
              <Route path="/admin/claims" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminDashboard />} />
            </Route>

            <Route path="/stats" element={<Navigate to={user?.role === 'admin' ? '/admin/stats' : '/'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
