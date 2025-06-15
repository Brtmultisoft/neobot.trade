import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import RewardService from '../../services/reward.service';

const RewardTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testGetAllRewards = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing getAllRewards...');
      
      const response = await RewardService.getAllRewards({ limit: 10 });
      console.log('getAllRewards response:', response);
      
      setResult({
        type: 'getAllRewards',
        data: response
      });
    } catch (err) {
      console.error('Error testing getAllRewards:', err);
      setError(`getAllRewards error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing getRewardStatistics...');
      
      const response = await RewardService.getRewardStatistics();
      console.log('getRewardStatistics response:', response);
      
      setResult({
        type: 'getRewardStatistics',
        data: response
      });
    } catch (err) {
      console.error('Error testing getRewardStatistics:', err);
      setError(`getRewardStatistics error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTriggerProcessing = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing triggerRewardProcessing...');
      
      const response = await RewardService.triggerRewardProcessing();
      console.log('triggerRewardProcessing response:', response);
      
      setResult({
        type: 'triggerRewardProcessing',
        data: response
      });
    } catch (err) {
      console.error('Error testing triggerRewardProcessing:', err);
      setError(`triggerRewardProcessing error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reward System Test Page
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Test Reward API Endpoints
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={testGetAllRewards}
              disabled={loading}
            >
              Test Get All Rewards
            </Button>
            <Button
              variant="contained"
              onClick={testGetStatistics}
              disabled={loading}
            >
              Test Get Statistics
            </Button>
            <Button
              variant="contained"
              onClick={testTriggerProcessing}
              disabled={loading}
            >
              Test Trigger Processing
            </Button>
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {result && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Result for: {result.type}
              </Typography>
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
                {JSON.stringify(result.data, null, 2)}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Instructions
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            1. First, run the test script to create sample data:
          </Typography>
          <Box
            component="pre"
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontSize: '0.875rem',
              mb: 2
            }}
          >
            cd server && node test-reward-api.js
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            2. Then test the API endpoints using the buttons above.
          </Typography>
          <Typography variant="body2">
            3. Check the browser console for detailed logs.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RewardTest;
