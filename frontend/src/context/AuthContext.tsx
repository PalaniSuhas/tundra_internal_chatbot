import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../services/api';

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set token first
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token is still valid by making a test request
          const response = await api.get('/api/auth/me');
          const userInfo = { 
            username: response.data.username, 
            email: response.data.email 
          };
          localStorage.setItem('user', JSON.stringify(userInfo));
          setUser(userInfo);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('lastSessionId');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authAPI.login(email, password);
      const token = response.data.access_token;
      console.log('Login successful, token received');
      
      localStorage.setItem('token', token);
      
      // Set token in headers first
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user info from backend to get actual username
      console.log('Fetching user info...');
      const userResponse = await api.get('/api/auth/me');
      console.log('User info received:', userResponse.data);
      
      const userInfo = { 
        username: userResponse.data.username, 
        email: userResponse.data.email 
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      setUser(userInfo);
      setIsAuthenticated(true);
      console.log('Login complete');
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error response:', error.response?.data);
      
      // If fetching user info fails, clear token and throw error
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    // Just register, don't auto-login
    await authAPI.register(username, email, password);
    // Don't set authenticated state - user needs to login
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastSessionId'); // Clear last session
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
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