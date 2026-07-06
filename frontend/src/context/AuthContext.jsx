import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('bot_token'));
  const [officer, setOfficer] = useState(
    localStorage.getItem('bot_officer') ? JSON.parse(localStorage.getItem('bot_officer')) : null
  );
  const [mustChangePassword, setMustChangePassword] = useState(
    localStorage.getItem('bot_mcp') === 'true'
  );

  const login = (newToken, newOfficer, mustChange) => {
    setToken(newToken);
    setOfficer(newOfficer);
    setMustChangePassword(mustChange);
    localStorage.setItem('bot_token', newToken);
    localStorage.setItem('bot_officer', JSON.stringify(newOfficer));
    localStorage.setItem('bot_mcp', String(mustChange));
  };

  const logout = () => {
    setToken(null);
    setOfficer(null);
    setMustChangePassword(false);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ token, officer, mustChangePassword, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth lazima itumike ndani ya AuthProvider');
  return context;
};
