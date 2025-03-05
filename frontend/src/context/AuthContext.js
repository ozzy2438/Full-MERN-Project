// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set token in axios headers
          api.defaults.headers.common['x-auth-token'] = token;
          
          // Get user data
          const response = await api.get('/auth/user');
          setUser(response.data);
        } catch (err) {
          console.error('Error loading user:', err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['x-auth-token'];
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Save token
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['x-auth-token'] = response.data.token;
      
      // Get user data
      const userResponse = await api.get('/auth/user');
      setUser(userResponse.data);
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş yapılırken bir hata oluştu');
      return false;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      });
      
      // Save token
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['x-auth-token'] = response.data.token;
      
      // Get user data
      const userResponse = await api.get('/auth/user');
      setUser(userResponse.data);
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Kayıt işlemi sırasında bir hata oluştu');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['x-auth-token'];
    setUser(null);
    setError(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
