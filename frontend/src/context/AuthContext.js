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
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          console.log('Attempting to load user with token');
          const response = await api.get('/auth/user');
          console.log('User data loaded:', response.data);
          setUser(response.data);
        } catch (err) {
          console.error('Error loading user:', err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (!response.data || !response.data.token) {
        throw new Error('No token received from server');
      }
      
      // Save token
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Get user data
      const userResponse = await api.get('/auth/user');
      console.log('User data response:', userResponse.data);
      setUser(userResponse.data);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'An error occurred during login');
      return false;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      console.log('Attempting registration with:', { name, email });
      
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      });
      
      console.log('Registration response:', response.data);
      
      if (!response.data || !response.data.token) {
        throw new Error('No token received from server');
      }
      
      // Save token
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Get user data
      const userResponse = await api.get('/auth/user');
      console.log('User data after registration:', userResponse.data);
      setUser(userResponse.data);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'An error occurred during registration');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
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
