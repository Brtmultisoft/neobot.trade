import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import CustomGrid from '../common/CustomGrid';
import { TradingPair } from '../../types/types';
import { tradingPairs } from '../../data/tradingPairs';
import { useTradingState } from '../../hooks/useTradingState';
import { useBinancePrice } from '../../hooks/useBinancePrice';
import MarketTrendVisualization from './MarketTrendVisualization';
import TradingActivation from './TradingActivation';
import ExchangeSelector from './ExchangeSelector';
import TradingLayout from './TradingLayout';
import PairSelector from './PairSelector';
import BasePriceDisplay from './BasePriceDisplay';
import FloatingProfits from './FloatingProfits';
import { useTradingData } from '../../hooks/useTradingData';
import UserService from '../../services/user.service';
import InvestmentService from '../../services/investment.service';
import TradingPackageService from '../../services/tradingpackage.service';

const TradingDashboard: React.FC = () => {
// const {
//     userData,
//     activatingProfit,
//     handleActivateDailyProfit,
  
//     tradeData,
//     loading: dataLoading
//   } = useTradingData();

  const {
    tradingActive,
    setTradingActive,
    totalProfit,
    setTotalProfit,
    activeTrades,
    sessionTime,
    incrementSessionTime
  } = useTradingState();

  const [currentPair, setCurrentPair] = useState<TradingPair>({
    symbol: 'BTCUSDT',
    name: 'BTC/USDT',
    fullName: 'Bitcoin'
  });


  

  // Use the enhanced Binance price hook to get real-time price data with auto-rotation
  const {
    price: binancePrice,
    btcPrice,  // Get the BTCUSDT base price
    error: binanceError,
    loading: binanceLoading,
    currentExchange,
    selectExchange: setCurrentExchange
  } = useBinancePrice(currentPair.symbol, tradingActive, 5000); // 5 seconds for faster switching

  // Set a default price if the API hasn't returned a value yet
  const [currentPrice, setCurrentPrice] = useState<number>(45000);

  // Store the BTCUSDT base price
  const [basePrice, setBasePrice] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  // User dynamic data states
  const [userData, setUserData] = useState<any>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [currentTradingPackage, setCurrentTradingPackage] = useState<any>(null);
  const [userROIRate, setUserROIRate] = useState<number>(1.0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [dailyProfitAmount, setDailyProfitAmount] = useState<number>(0);
  // Update currentPrice when binancePrice changes
  useEffect(() => {
    if (binancePrice !== null) {
      setCurrentPrice(binancePrice);
    }
  }, [binancePrice]);

  // Update basePrice when btcPrice changes
  useEffect(() => {
    if (btcPrice !== null) {
      setBasePrice(btcPrice);
    }
  }, [btcPrice]);

  // Function to get current pair info
  const getCurrentPairInfo = useCallback(() => {
    return tradingPairs.find(pair => pair.symbol === currentPair.symbol) || tradingPairs[0];
  }, [currentPair.symbol]);

  // Function to log price updates
  const logPriceUpdate = useCallback((newPrice: number) => {
    if (newPrice) {
      setCurrentPrice(prevPrice => {
        // Calculate percent change for display purposes
        const percentChange = ((newPrice - prevPrice) / prevPrice) * 100;
        console.log(`Price updated: $${newPrice} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%)`);
        return newPrice;
      });

      console.log(`Updated ${currentPair.symbol} price from Binance API: ${newPrice}`);
    }
  }, [currentPair.symbol]);

  // Function to change trading pair
  const changeTradingPair = useCallback(() => {
    if (!tradingActive) return;

    // Find current pair index
    const currentIndex = tradingPairs.findIndex(pair => pair.symbol === currentPair.symbol);
    // Get next pair (or loop back to first)
    const nextIndex = (currentIndex + 1) % tradingPairs.length;
    const nextPair = tradingPairs[nextIndex];

    console.log('Switching to trading pair:', nextPair.symbol);

    // Update current pair
    setCurrentPair(nextPair);
  }, [tradingActive, currentPair.symbol]);

  // Log price updates when binancePrice changes
  useEffect(() => {
    if (binancePrice !== null) {
      logPriceUpdate(binancePrice);
    }
  }, [binancePrice, logPriceUpdate]);

  // Handle auto-switching trading pairs
  useEffect(() => {
    let pairInterval: number;
    let isComponentMounted = true;

    // Auto-switch trading pairs every 30 seconds when trading is active
    if (tradingActive) {
      pairInterval = window.setInterval(() => {
        if (isComponentMounted) {
          changeTradingPair();
        }
      }, 30000);
    }

    return () => {
      isComponentMounted = false;
      if (pairInterval) clearInterval(pairInterval);
    };
  }, [tradingActive, changeTradingPair]);

  // Log active trading status
  useEffect(() => {
    if (tradingActive) {
      // Get current pair info for display
      const pairInfo = getCurrentPairInfo();
      console.log(`Active trading with ${pairInfo.fullName} (${pairInfo.symbol})`);
      console.log(`Trading on exchange: ${currentExchange.name}`);
    }
  }, [tradingActive, currentExchange.name, getCurrentPairInfo]);

  // Display current trading status
  useEffect(() => {
    if (tradingActive) {
      const pairInfo = getCurrentPairInfo();
      console.log(`Trading activated with ${pairInfo.fullName} on ${currentExchange.name}`);
      console.log('Auto-switching pairs every 30 seconds');
      console.log('Auto-switching exchanges every 5 seconds (via API)');
      console.log('Using Binance API for real-time price data with 10-second updates');
      console.log(`BTCUSDT base price: $${basePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'Loading...'}`);
      console.log(`Current ${currentPair.symbol} price: $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

      if (binanceError) {
        console.warn(`Binance API error: ${binanceError}`);
      }
    } else {
      console.log('Trading inactive');
    }
  }, [tradingActive, getCurrentPairInfo, currentExchange.name, binanceError, basePrice, currentPair.symbol, currentPrice]);

  // Update session time
  useEffect(() => {
    let timer: number;

    if (tradingActive) {
      timer = window.setInterval(() => {
        incrementSessionTime();
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tradingActive, incrementSessionTime]);

  // Generate dynamic floating profits based on user's actual investment and ROI
  useEffect(() => {
    let profitInterval: number;

    if (tradingActive && totalInvestment > 0) {
      profitInterval = window.setInterval(() => {
        // Calculate profit based on user's actual investment and ROI rate
        const baseProfit = (totalInvestment * userROIRate) / 100; // Daily profit
        const profitPerSecond = baseProfit / (24 * 60 * 60); // Convert to per second

        // Add some randomness (±20% variation)
        const randomMultiplier = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const actualProfit = profitPerSecond * randomMultiplier;

        // 95% chance of profit, 5% chance of small loss
        const isProfit = Math.random() > 0.05;
        const amount = isProfit ? actualProfit : (-actualProfit * 0.1);

        // Update total profit
        setTotalProfit(prev => prev + amount);

        // Log profit details for debugging
        if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
          console.log(`Dynamic profit: $${amount.toFixed(6)} (Base: $${baseProfit.toFixed(2)}/day, ROI: ${userROIRate}%)`);
        }
      }, 1000);
    }

    return () => {
      if (profitInterval) clearInterval(profitInterval);
    };
  }, [tradingActive, totalInvestment, userROIRate, setTotalProfit]);

  // Handle trading activation
  const handleActivateTrading = () => {
    setTradingActive(true);
  };
  // Fetch user's dynamic trading data
  const fetchUserTradingData = async () => {
    try {
      setLoading(true);

      // 1. Get user profile
      const userResponse = await UserService.getUserProfile();
      if (userResponse && userResponse.status) {
        const user = userResponse.result;
        setUserData(user);

        console.log("User profile loaded:", user);

        // 2. Get user investments
        const investmentResponse = await InvestmentService.getUserInvestments();
        if (investmentResponse && investmentResponse.status && investmentResponse.data?.docs) {
          const investments = investmentResponse.data.docs;
          setUserInvestments(investments);

          // Calculate total investment
          const totalInvested = investments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          setTotalInvestment(totalInvested);

          console.log("User investments loaded:", investments);
          console.log("Total investment amount:", totalInvested);

          // 3. Get current trading package info
          if (user.current_trading_package_id) {
            try {
              const packageResponse = await TradingPackageService.getTradingPackageById(user.current_trading_package_id);
              if (packageResponse && packageResponse.status) {
                const tradingPackage = packageResponse.data;
                setCurrentTradingPackage(tradingPackage);
                setUserROIRate(tradingPackage.daily_trading_roi || 1.0);

                // Calculate daily profit based on user's actual investment and package ROI
                const dailyProfit = (totalInvested * (tradingPackage.daily_trading_roi || 1.0)) / 100;
                setDailyProfitAmount(dailyProfit);

                console.log("Current trading package:", tradingPackage);
                console.log("User ROI rate:", tradingPackage.daily_trading_roi);
                console.log("Daily profit amount:", dailyProfit);
              }
            } catch (packageError) {
              console.error('Error fetching trading package:', packageError);
              // Fallback to default values
              setUserROIRate(1.0);
              setDailyProfitAmount((totalInvested * 1.0) / 100);
            }
          } else {
            // No current package, use default ROI
            console.log("No current trading package found, using default ROI");
            setUserROIRate(1.0);
            setDailyProfitAmount((totalInvested * 1.0) / 100);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTradingData();
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <CustomGrid container spacing={0} sx={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
        <CustomGrid item xs={12} sx={{ width: '100%', maxWidth: '100%', padding: 0 }}>
          <Box sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
            <MarketTrendVisualization
              tradingActive={tradingActive}
              totalProfit={totalProfit}
              currentPair={currentPair}
            />
          </Box>
        </CustomGrid>

        <CustomGrid item xs={12} sx={{ width: '100%', maxWidth: '100%', padding: 0 }}>
          <Box sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
            <TradingActivation
              tradingActive={tradingActive}
              onActivate={handleActivateTrading}
              sessionTime={sessionTime}
              totalProfit={totalProfit}
              activeTrades={activeTrades}
              // Dynamic user data
              userData={userData}
              currentTradingPackage={currentTradingPackage}
              userROIRate={userROIRate}
              totalInvestment={totalInvestment}
              dailyProfitAmount={dailyProfitAmount}
              loading={loading}
            />
          </Box>
        </CustomGrid>

        <CustomGrid item xs={12} sx={{ width: '100%', maxWidth: '100%', padding: 0 }}>
          <Box sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
            <ExchangeSelector
              currentExchange={currentExchange}
              setCurrentExchange={setCurrentExchange}
              tradingActive={tradingActive}
            />
          </Box>
        </CustomGrid>

        {/* Display BTCUSDT base price */}
        {/* <CustomGrid item xs={12} sx={{ width: '100%', maxWidth: '100%', padding: 0 }}>
          <Box sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
            <BasePriceDisplay
              basePrice={basePrice}
              loading={binanceLoading}
            />
          </Box>
        </CustomGrid> */}

        <CustomGrid item xs={12} sx={{ width: '100%', maxWidth: '100%', padding: 0 }}>
          {binanceLoading && !binancePrice ? (
            <Box sx={{
              p: 2,
              textAlign: 'center',
              color: 'primary.main',
              fontSize: '0.875rem'
            }}>
              Loading price data from Binance API...
            </Box>
          ) : binanceError ? (
            <Box sx={{
              p: 2,
              textAlign: 'center',
              color: 'error.main',
              fontSize: '0.875rem'
            }}>
              Error loading price data: {binanceError}
            </Box>
          ) : null}

          <TradingLayout
            currentPair={currentPair}
            tradingActive={tradingActive}
            currentPrice={currentPrice}
          />
        </CustomGrid>

        {/* <CustomGrid item xs={12}>
          <PairSelector
            currentPair={currentPair}
            setCurrentPair={setCurrentPair}
            tradingActive={tradingActive}
          />
        </CustomGrid> */}
      </CustomGrid>

      {tradingActive && <FloatingProfits />}
    </Box>
  );
};

export default TradingDashboard;
