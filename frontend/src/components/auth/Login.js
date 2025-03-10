// frontend/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert,
  InputAdornment,
  IconButton,
  Container,
  Avatar,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { CircularProgress } from '@mui/material';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login component: Attempting login with:', { email: formData.email });
      
      // API URL'yi kontrol et
      console.log('Login component: API URL:', process.env.REACT_APP_API_URL);
      
      // Add debug info
      console.log('Login component: Browser info:', navigator.userAgent);
      console.log('Login component: Current URL:', window.location.href);
      
      // Try direct fetch to test CORS
      try {
        console.log('Login component: Testing CORS with fetch...');
        const testResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://career-path.onrender.com/api'}/auth/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Login component: CORS test response status:', testResponse.status);
        const testData = await testResponse.json();
        console.log('Login component: CORS test response data:', testData);
      } catch (corsErr) {
        console.error('Login component: CORS test failed:', corsErr);
      }
      
      const success = await login(formData.email, formData.password);
      
      console.log('Login component: Login result:', success ? 'success' : 'failed');
      
      if (success) {
        console.log('Login component: Redirecting to dashboard');
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login component: Login error:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Login component: Response error details:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('Login component: Request was made but no response received');
      }
      
      // User-friendly error message
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (err.message && err.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection or the server might be down.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Login service not found. The API endpoint might be incorrect.';
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid credentials. Please check your email and password.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign up
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
