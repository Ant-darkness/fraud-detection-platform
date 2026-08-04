import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
// Kama unatumia react-hot-toast:
import { toast } from 'react-hot-toast'; 

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
  
  // Kutunza taarifa za muda za login kabla ya kubadili password ya lazima
  const [tempUser, setTempUser] = useState(null);

  // Kufuatilia usalama wa Session (dakika 5 za kutofanya kazi)
  useEffect(() => {
    const checkSession = () => {
      if (user) {
        const now = Date.now();
        const inactiveTime = now - parseInt(lastActive, 10);
        if (inactiveTime > 300000) { // Dakika 5
          logout();
          
          // Toastbadala ya alert ya juu
          toast.error("Kipindi chako kimeisha kwa usalama. Tafadhali ingia tena.", {
            duration: 5000,
            position: 'top-right',
            style: {
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '13px'
            }
          });
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
      const data = await api.auth.login(email.trim(), password.trim());
      
      const loggedInUser = {
        officer_id: data.officer.officer_id,
        full_name: data.officer.full_name,
        email: email.trim().toLowerCase(),
        role: data.officer.role,
        token: data.access_token 
      };

      // Uhakiki thabiti wa lazima ya kubadili password
      const needsChange = data.must_change_password === true || data.mustChangePassword === true;

      if (needsChange) {
        setMustChangePassword(true);
        setTempUser(loggedInUser); // Mtunze hapa ili tutumie token yake kwenye header ya force change
        return { success: true, mustChangePassword: true };
      } else {
        setMustChangePassword(false);
        setTempUser(null);
        localStorage.setItem('bot_user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        updateActivity();
        return { success: true, mustChangePassword: false };
      }
    } catch (err) {
      return { success: false, error: err.message || "Imeshindikana kuingia kwenye mfumo." };
    }
  };

  // --- FORCE CHANGE PASSWORD ---
  const changeForcePassword = async (newPassword) => {
    try {
      const tokenToUse = tempUser?.token;
      if (!tokenToUse) {
        throw new Error("Kipindi cha muda cha mabadiliko ya nenosiri kimeisha. Tafadhali ingia tena.");
      }

      // Piga API ya force change ikisindikizwa na Bearer token yake ya muda
      await api.auth.forceChangePassword(newPassword.trim(), tokenToUse);
      
      // Kusafisha data zote za muda baada ya mafanikio ili kumlazimisha mtumiaji alogin upya kwa usalama
      setMustChangePassword(false);
      setTempUser(null); 
      return true;
    } catch (err) {
      throw new Error(err.message || "Imeshindikana kusasisha nenosiri.");
    }
  };

  const logout = () => {
    setUser(null);
    setTempUser(null);
    setMustChangePassword(false);
    localStorage.removeItem('bot_user');
    localStorage.removeItem('bot_last_active');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      mustChangePassword, 
      setMustChangePassword, 
      changeForcePassword, 
      updateActivity 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
