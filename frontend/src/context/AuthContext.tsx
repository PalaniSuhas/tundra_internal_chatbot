import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

 const login = async (email: string, password: string) => {
  const response = await authAPI.login(email, password);
  const token = response.data.access_token;
  localStorage.setItem('token', token);
  // Explicitly set headers for the current session to avoid race condition
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
  setIsAuthenticated(true);
};

  const register = async (username: string, email: string, password: string) => {
    const response = await authAPI.register(username, email, password);
    localStorage.setItem('token', response.data.access_token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};