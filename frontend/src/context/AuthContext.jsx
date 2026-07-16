import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bot_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [lastActive, setLastActive] = useState(() => {
    return localStorage.getItem('bot_last_active') || Date.now();
  });

  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Kufuatilia usalama wa Session (dakika 5)
  useEffect(() => {
    const checkSession = () => {
      if (user) {
        const now = Date.now();
        const inactiveTime = now - parseInt(lastActive, 10);
        if (inactiveTime > 300000) {
          logout();
          alert("Kipindi chako kimeisha kwa usalama. Tafadhali ingia tena.");
        }
      }
    };

    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [user, lastActive]);

  const updateActivity = () => {
    const now = Date.now();
    setLastActive(now);
    localStorage.setItem('bot_last_active', now.toString());
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();

    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [user]);

  // --- LIVE LOGIN FUNCTION ---
  const login = async (email, password) => {
    try {
      // Piga simu kwenda FastAPI Backend!
      const data = await api.auth.login(email, password);
      
      const loggedInUser = {
        officer_id: data.officer_id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        token: data.access_token || data.token
      };

      // Uhifadhi wa token ya JWT kwenye localStorage ukiwa umebaki salama
      localStorage.setItem('bot_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      
      if (data.must_change_password) {
        setMustChangePassword(true);
        return { success: true, mustChangePassword: true };
      } else {
        setMustChangePassword(false);
        updateActivity();
        return { success: true, mustChangePassword: false };
      }
    } catch (err) {
      return { success: false, error: err.message || "Imeshindikana kuingia kwenye mfumo." };
    }
  };

  // --- FORCE CHANGE PASSWORD (Wakati wa First Login) ---
  const changeForcePassword = async (newPassword) => {
    try {
      // Piga endpoint ya /auth/change-password tukiambatanisha token ya huyu mtu
      await api.auth.changePassword(newPassword);
      setMustChangePassword(false);
      updateActivity();
      return true;
    } catch (err) {
      throw new Error(err.message || "Imeshindikana kusasisha nenosiri.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bot_user');
    localStorage.removeItem('bot_last_active');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, mustChangePassword, setMustChangePassword, changeForcePassword, updateActivity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
