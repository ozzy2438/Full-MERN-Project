// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
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
      
      console.log('AuthContext: Checking for saved token');
      
      if (token) {
        console.log('AuthContext: Token found, attempting to load user');
        try {
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          console.log('AuthContext: Requesting user data from:', api.defaults.baseURL + '/auth/user');
          const response = await api.get('/auth/user');
          console.log('AuthContext: User data loaded successfully');
          setUser(response.data);
        } catch (err) {
          console.error('AuthContext: Error loading user:', err.message);
          console.error('AuthContext: Error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            config: {
              url: err.config?.url,
              method: err.config?.method,
              baseURL: err.config?.baseURL,
              headers: err.config?.headers
            }
          });
          
          // Don't remove token on 404 errors during initial deployment testing
          if (err.response?.status !== 404) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
          }
        }
      } else {
        console.log('AuthContext: No token found');
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    console.log('AuthContext: Login attempt');
    try {
      // Log full URL for debugging
      const loginUrl = `${api.defaults.baseURL}/auth/login`;
      console.log('AuthContext: Sending login request to:', loginUrl);
      console.log('AuthContext: Request data:', { email, password: '******' });
      
      // Create request data as a JSON string
      const requestData = JSON.stringify({ email, password });
      console.log('AuthContext: Stringified request data:', requestData);
      
      // Make direct fetch call with full URL for debugging
      const fetchResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestData
      });
      
      console.log('AuthContext: Fetch response status:', fetchResponse.status);
      const responseData = await fetchResponse.json();
      console.log('AuthContext: Fetch response data:', responseData);
      
      const response = { data: responseData, status: fetchResponse.status };
      
      console.log('AuthContext: Login successful, token received');
      console.log('AuthContext: Response status:', response.status);
      console.log('AuthContext: Response headers:', response.headers);
      
      // Save token
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('AuthContext: Token set in headers');
      
      // Skip user data fetch for now to avoid CORS issues
      // Just set basic user data
      setUser({ email });
      console.log('AuthContext: Set basic user data');
      
      setError(null);
      return true;
    } catch (err) {
      console.error('AuthContext: Login error:', err.message);
      
      // Log request details
      console.error('AuthContext: Request details:', {
        url: `${api.defaults.baseURL}/auth/login`,
        method: 'POST',
        data: { email, password: '******' }
      });
      
      // Log response details if available
      if (err.response) {
        console.error('AuthContext: Error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('AuthContext: No response received:', err.request);
      }
      
      setError(err.response?.data?.error || 'An error occurred during login');
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
      setError(err.response?.data?.error || 'An error occurred during registration');
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
