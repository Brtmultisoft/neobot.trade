import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Stack, Button, alpha, useTheme } from '@mui/material';
import { TradingPair } from '../../types/types';
import { generateOrderBook } from '../../utils/dataSimulation';

interface OrderBookProps {
  tradingActive: boolean;
  currentPair: TradingPair;
  currentPrice?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ tradingActive, currentPair, currentPrice = 45000 }) => {
  const [precision, setPrecision] = useState<string>('0.1');
  const [asks, setAsks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const theme = useTheme();

  useEffect(() => {
    let orderBookInterval: number;

    if (tradingActive) {
      // Initial data
      const { asks: initialAsks, bids: initialBids } = generateOrderBook(currentPrice);
      setAsks(initialAsks);
      setBids(initialBids);

      // Regular updates
      orderBookInterval = window.setInterval(() => {
        const { asks: newAsks, bids: newBids } = generateOrderBook(currentPrice);
        setAsks(newAsks);
        setBids(newBids);
      }, 5000);
    }

    return () => {
      if (orderBookInterval) clearInterval(orderBookInterval);
    };
  }, [tradingActive, currentPrice]);

  return (
    <Paper
      sx={{
        height: { xs: 'auto', sm: 450, md: 500 }, // Responsive height
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme.palette.background.paper,
        borderRadius: { xs: 0.5, sm: 1 },
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        minHeight: { xs: 350, sm: 400, md: 500 }, // Ensure minimum height on all devices
      }}
    >
      {!tradingActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.background.default,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            backdropFilter: 'blur(3px)'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Trading Inactive
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          padding: { xs: '8px 12px', sm: '12px 15px' },
          borderBottom: '1px solid divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 0 }
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.primary',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            fontWeight: 600,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Order Book
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 1 }}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' }
          }}
        >
          {['0.1', '0.01', '0.001'].map((value) => (
            <Button
              key={value}
              variant="text"
              size="small"
              sx={{
                minWidth: { xs: '30px', sm: 'auto' },
                py: { xs: 0.3, sm: 0.5 },
                px: { xs: 0.5, sm: 1 },
                fontSize: { xs: 10, sm: 12 },
                background: precision === value ? alpha('#f0b90b', 0.1) : 'rgba(255, 255, 255, 0.03)',
                color: precision === value ? 'primary.main' : 'text.primary',
                '&:hover': {
                  background: precision === value ? alpha('#f0b90b', 0.2) : 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onClick={() => setPrecision(value)}
            >
              {value}
            </Button>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Asks Section - Sell Orders */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: { xs: 100, sm: 140, md: 180 }, // Ensure min height for all screens
            maxHeight: { xs: '150px', sm: '200px', md: '260px', lg: '320px' }, // Responsive max height
            '&::-webkit-scrollbar': {
              width: { xs: '3px', sm: '4px' },
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
            }
          }}
        >
          {asks.map((ask, index) => (
            <Box
              key={`ask-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1.2fr 1fr', sm: '1.2fr 1fr 1fr' }, // Hide total on mobile
                padding: { xs: '4px 8px', sm: '6px 18px', md: '8px 24px' },
                fontSize: { xs: 11, sm: 13, md: 15 },
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)'
                },
                color: 'error.main',
                height: { xs: '24px', sm: '32px', md: '38px' }, // Taller rows on larger screens
                alignItems: 'center'
              }}
            >
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: { xs: 500, sm: 400 }
                }}
              >
                {parseFloat(ask.price).toFixed(2)}
              </Box>
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center'
                }}
              >
                {ask.amount}
              </Box>
              {/* Show total only on sm and up */}
              {(
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'right',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {ask.total}
                </Box>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: `${ask.depth}%`,
                  background: alpha('#f6465d', 0.1),
                  zIndex: 1
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Spread Section */}
        <Box
          sx={{
            padding: { xs: '5px 8px', sm: '10px 24px', md: '14px 32px' },
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'center', // Center on all screens
            alignItems: 'center',
            gap: { xs: 1, sm: 3 },
            fontSize: { xs: 11, sm: 13, md: 15 },
            color: 'text.secondary',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: 11, sm: 13, md: 15 },
              fontWeight: 500
            }}
          >
            Spread
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: 11, sm: 13, md: 15 },
              fontFamily: "'Roboto Mono', monospace",
            }}
          >
            $12.45 (0.03%)
          </Typography>
        </Box>

        {/* Bids Section - Buy Orders */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: { xs: 100, sm: 140, md: 180 },
            maxHeight: { xs: '150px', sm: '200px', md: '260px', lg: '320px' },
            '&::-webkit-scrollbar': {
              width: { xs: '3px', sm: '4px' },
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
            }
          }}
        >
          {bids.map((bid, index) => (
            <Box
              key={`bid-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1.2fr 1fr', sm: '1.2fr 1fr 1fr' },
                padding: { xs: '4px 8px', sm: '6px 18px', md: '8px 24px' },
                fontSize: { xs: 11, sm: 13, md: 15 },
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)'
                },
                color: 'secondary.main',
                height: { xs: '24px', sm: '32px', md: '38px' },
                alignItems: 'center'
              }}
            >
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: { xs: 500, sm: 400 }
                }}
              >
                {parseFloat(bid.price).toFixed(2)}
              </Box>
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center'
                }}
              >
                {bid.amount}
              </Box>
              {/* Show total only on sm and up */}
              {(
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'right',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {bid.total}
                </Box>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: `${bid.depth}%`,
                  background: alpha('#0ecb81', 0.1),
                  zIndex: 1
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderBook;