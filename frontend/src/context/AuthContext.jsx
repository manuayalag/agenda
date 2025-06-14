import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  const isAdmin = user && user.role === 'admin';
  const isSectorAdmin = user && (user.role === 'sector_admin' || user.role === 'admin');
  const isDoctor = user && user.role === 'doctor';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        isAuthenticated, 
        isAdmin, 
        isSectorAdmin,
        isDoctor,
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
