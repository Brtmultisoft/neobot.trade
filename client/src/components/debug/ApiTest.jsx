import { useState } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert } from '@mui/material';
import api from '../../services/api';

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testApi = async (endpoint, label) => {
    try {
      console.log(`Testing ${label}: ${endpoint}`);
      const response = await api.get(endpoint);
      console.log(`${label} response:`, response);
      
      setResults(prev => ({
        ...prev,
        [label]: {
          success: true,
          data: response.data || response,
          endpoint
        }
      }));
    } catch (error) {
      console.error(`${label} error:`, error);
      setResults(prev => ({
        ...prev,
        [label]: {
          success: false,
          error: error.message,
          endpoint
        }
      }));
    }
  };

  const testAllApis = async () => {
    setLoading(true);
    setResults({});
    
    await testApi('/user/get-user-investments', 'Investments');
    await testApi('/user/get-user-direct', 'Direct Referrals');
    await testApi('/user/get-direct-incomes', 'Direct Income');
    await testApi('/user/get-investment-sum', 'Investment Sum');
    await testApi('/user/get-income-sum?type=referral_bonus', 'Income Sum');
    
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 API Test Dashboard
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testAllApis} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Testing APIs...' : 'Test All APIs'}
      </Button>

      {Object.entries(results).map(([label, result]) => (
        <Card key={label} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {label} - {result.endpoint}
            </Typography>
            
            {result.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ API call successful
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                ❌ API call failed: {result.error}
              </Alert>
            )}
            
            <Typography variant="body2" component="pre" sx={{ 
              background: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 200
            }}>
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ApiTest;
