import React from 'react';
import { Box } from '@mui/material';
import MetricCard from './MetricCard';

interface MetricsPanelProps {
  btcPrice: number;
  totalInvestment: number;
  roiRate?: number | null;
  dailyProfitAmount?: number | null;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  btcPrice,
  totalInvestment,
  roiRate,
  dailyProfitAmount
}) => {
  return (
    <Box mb={6}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title="BTC PRICE"
            value={`$${btcPrice.toFixed(2)}`}
            color="blue"
          />
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title="INVESTMENT AMOUNT"
            value={`$${totalInvestment.toFixed(2)}`}
            color="amber"
          />
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title={`DAILY PROFIT (${typeof roiRate === 'number' && !isNaN(roiRate) ? roiRate + '%' : '0%'})`}
            value={`$${typeof dailyProfitAmount === 'number' && !isNaN(dailyProfitAmount) ? dailyProfitAmount.toFixed(2) : '0.00'}`}
            color="green"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MetricsPanel;
