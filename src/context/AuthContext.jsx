import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/auth";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      let userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        userInfo = JSON.parse(userInfo);
        try {
          const res = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
          const nextUser = { ...res.data, token: userInfo.token };
          setUser(nextUser);
          localStorage.setItem("userInfo", JSON.stringify(nextUser));
        } catch (error) {
          console.error("Token expired or invalid");
          localStorage.removeItem("userInfo");
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      setUser(res.data);
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      toast.success("Logged in successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/signup`, { name, email, password });
      setUser(res.data);
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      toast.success("Account created successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Signup failed");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
    toast.success("Logged out successfully");
  };

  const updateUser = (data) => setUser({ ...user, ...data });

  useEffect(() => {
    if (user) {
      localStorage.setItem("userInfo", JSON.stringify(user));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
