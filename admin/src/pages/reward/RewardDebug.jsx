import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  TextField,
  Divider
} from '@mui/material';
import { API_URL } from '../../config';

const RewardDebug = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

  const testDirectAPI = async (endpoint) => {
    try {
      setLoading(true);
      setResult(null);
      
      console.log(`Testing ${endpoint}...`);
      console.log('API URL:', API_URL);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult({
        endpoint,
        status: response.status,
        success: response.ok,
        data: data
      });
      
    } catch (error) {
      console.error('Direct API test error:', error);
      setResult({
        endpoint,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testServerConnection = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      console.log('Testing server connection...');
      console.log('API URL:', API_URL);
      
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
      });
      
      console.log('Health check status:', response.status);
      
      if (response.ok) {
        const data = await response.text();
        setResult({
          endpoint: '/health',
          status: response.status,
          success: true,
          data: data
        });
      } else {
        setResult({
          endpoint: '/health',
          status: response.status,
          success: false,
          error: 'Server not responding properly'
        });
      }
      
    } catch (error) {
      console.error('Server connection test error:', error);
      setResult({
        endpoint: '/health',
        status: 'ERROR',
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateToken = () => {
    localStorage.setItem('admin_token', token);
    console.log('Token updated in localStorage');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reward API Debug Tool
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Configuration
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="API URL"
              value={API_URL}
              disabled
              helperText="Current API URL from config"
            />
            
            <TextField
              fullWidth
              label="Admin Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              helperText="Enter your admin token"
              type="password"
            />
            
            <Button onClick={updateToken} variant="outlined">
              Update Token in localStorage
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            API Tests
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => testServerConnection()}
              disabled={loading}
            >
              Test Server Connection
            </Button>
            
            <Button
              variant="contained"
              onClick={() => testDirectAPI('/admin/rewards')}
              disabled={loading}
            >
              Test Rewards API
            </Button>
            
            <Button
              variant="contained"
              onClick={() => testDirectAPI('/admin/rewards/statistics')}
              disabled={loading}
            >
              Test Statistics API
            </Button>
          </Stack>

          {loading && (
            <Alert severity="info">
              Testing API endpoint...
            </Alert>
          )}

          {result && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Test Result: {result.endpoint}
              </Typography>
              
              <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                Status: {result.status} - {result.success ? 'SUCCESS' : 'FAILED'}
              </Alert>
              
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '0.875rem'
                }}
              >
                {JSON.stringify(result, null, 2)}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Debug Information
          </Typography>
          
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Current API URL:</strong> {API_URL}
            </Typography>
            <Typography variant="body2">
              <strong>Admin Token Present:</strong> {localStorage.getItem('admin_token') ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              <strong>Browser:</strong> {navigator.userAgent}
            </Typography>
            <Typography variant="body2">
              <strong>Current Time:</strong> {new Date().toISOString()}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardDebug;
