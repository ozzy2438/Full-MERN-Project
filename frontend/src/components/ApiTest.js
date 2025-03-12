import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [postTestResult, setPostTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState(null);
  const [postError, setPostError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'https://career-path.onrender.com/api';

  const runGetTest = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing GET endpoint:', `${apiUrl}/auth/test`);
      const response = await fetch(`${apiUrl}/auth/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('GET test response status:', response.status);
      const data = await response.json();
      console.log('GET test response data:', data);
      
      setTestResult(data);
    } catch (err) {
      console.error('GET test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runPostTest = async () => {
    setPostLoading(true);
    setPostError(null);
    try {
      const testData = {
        email: 'test@example.com',
        password: 'test123'
      };
      
      console.log('Testing POST endpoint:', `${apiUrl}/auth/test-post`);
      console.log('POST test data:', testData);
      
      const response = await fetch(`${apiUrl}/auth/test-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      console.log('POST test response status:', response.status);
      const data = await response.json();
      console.log('POST test response data:', data);
      
      setPostTestResult(data);
    } catch (err) {
      console.error('POST test error:', err);
      setPostError(err.message);
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Connection Test
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          GET Test
        </Typography>
        <Button 
          variant="contained" 
          onClick={runGetTest} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Run GET Test'}
        </Button>
        
        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">Error: {error}</Typography>
          </Paper>
        )}
        
        {testResult && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Result:</Typography>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Paper>
        )}
      </Box>
      
      <Box>
        <Typography variant="h6" gutterBottom>
          POST Test
        </Typography>
        <Button 
          variant="contained" 
          onClick={runPostTest} 
          disabled={postLoading}
          sx={{ mb: 2 }}
        >
          {postLoading ? <CircularProgress size={24} /> : 'Run POST Test'}
        </Button>
        
        {postError && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">Error: {postError}</Typography>
          </Paper>
        )}
        
        {postTestResult && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Result:</Typography>
            <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(postTestResult, null, 2)}
            </pre>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ApiTest;
