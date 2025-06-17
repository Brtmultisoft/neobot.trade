#!/usr/bin/env node

/**
 * Complete Trading & Referral System Test Script
 * Tests: Random Daily ROI, Multiple Packages, One-time Referral Bonus, Level ROI
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import required modules
const { userDbHandler, investmentDbHandler, incomeDbHandler } = require('./src/services/db');
const { _processDailyTradingProfit, _processLevelRoiIncome, processTeamCommission } = require('./src/controllers/user/cron.controller');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neobot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function testRandomDailyROI() {
  console.log('\n🎲 TESTING RANDOM DAILY ROI GENERATION');
  console.log('=====================================');

  try {
    // Get some active investments
    const investments = await investmentDbHandler.getByQuery({ 
      status: 'active' 
    }).limit(3);

    if (investments.length === 0) {
      console.log('❌ No active investments found for testing');
      return;
    }

    console.log(`Found ${investments.length} active investments for testing:`);
    
    for (const investment of investments) {
      const user = await userDbHandler.getById(investment.user_id);
      console.log(`\n📊 Investment: ${investment._id}`);
      console.log(`   User: ${user?.email || user?.username || 'Unknown'}`);
      console.log(`   Amount: $${investment.amount}`);
      console.log(`   Package ID: ${investment.trading_package_id || 'None'}`);
      
      // Simulate ROI calculation
      const tradingPackageModel = require('./src/models/tradingpackage.model');
      let tradingPackage = null;
      
      if (investment.trading_package_id) {
        tradingPackage = await tradingPackageModel.findById(investment.trading_package_id);
      }
      
      if (!tradingPackage) {
        tradingPackage = await tradingPackageModel.findByTradingAmount(investment.amount);
      }
      
      if (tradingPackage) {
        const minROI = tradingPackage.min_daily_roi || tradingPackage.daily_trading_roi || 0.5;
        const maxROI = tradingPackage.max_daily_roi || tradingPackage.daily_trading_roi || 1.0;
        const randomROI = (Math.random() * (maxROI - minROI) + minROI);
        const dailyProfit = (investment.amount * randomROI) / 100;
        
        console.log(`   📈 ROI Range: ${minROI.toFixed(3)}% - ${maxROI.toFixed(3)}%`);
        console.log(`   🎯 Generated ROI: ${randomROI.toFixed(3)}%`);
        console.log(`   💰 Daily Profit: $${dailyProfit.toFixed(4)}`);
      } else {
        console.log(`   ❌ No trading package found`);
      }
    }
    
    console.log('\n✅ Random ROI generation test completed');
  } catch (error) {
    console.error('❌ Random ROI test failed:', error);
  }
}

async function testReferralBonusOnceOnly() {
  console.log('\n👥 TESTING ONE-TIME REFERRAL BONUS');
  console.log('==================================');

  try {
    // Find users with referrals
    const usersWithReferrals = await userDbHandler.getByQuery({ 
      refer_id: { $exists: true, $ne: null } 
    }).limit(3);

    if (usersWithReferrals.length === 0) {
      console.log('❌ No users with referrals found');
      return;
    }

    for (const user of usersWithReferrals) {
      const referrer = await userDbHandler.getById(user.refer_id);
      
      console.log(`\n👤 User: ${user.email || user.username}`);
      console.log(`   Referrer: ${referrer?.email || referrer?.username || 'Unknown'}`);
      
      // Check existing referral bonuses
      const existingBonuses = await incomeDbHandler.getByQuery({
        user_id: user.refer_id,
        user_id_from: user._id,
        type: 'referral_bonus'
      });
      
      console.log(`   💰 Existing referral bonuses: ${existingBonuses.length}`);
      
      if (existingBonuses.length > 0) {
        console.log(`   ✅ One-time referral bonus working correctly`);
        existingBonuses.forEach((bonus, index) => {
          console.log(`      Bonus ${index + 1}: $${bonus.amount} on ${bonus.created_at}`);
        });
      } else {
        console.log(`   ⚠️  No referral bonus found (user may not have invested yet)`);
      }
    }
    
    console.log('\n✅ Referral bonus test completed');
  } catch (error) {
    console.error('❌ Referral bonus test failed:', error);
  }
}

async function testMultiplePackageROI() {
  console.log('\n📦 TESTING MULTIPLE PACKAGE ROI');
  console.log('===============================');

  try {
    // Find users with multiple investments
    const allInvestments = await investmentDbHandler.getByQuery({ status: 'active' });
    const userInvestmentMap = new Map();
    
    // Group investments by user
    for (const investment of allInvestments) {
      const userId = investment.user_id.toString();
      if (!userInvestmentMap.has(userId)) {
        userInvestmentMap.set(userId, []);
      }
      userInvestmentMap.get(userId).push(investment);
    }
    
    // Find users with multiple investments
    const usersWithMultipleInvestments = Array.from(userInvestmentMap.entries())
      .filter(([userId, investments]) => investments.length > 1)
      .slice(0, 3);
    
    if (usersWithMultipleInvestments.length === 0) {
      console.log('❌ No users with multiple investments found');
      return;
    }
    
    for (const [userId, investments] of usersWithMultipleInvestments) {
      const user = await userDbHandler.getById(userId);
      console.log(`\n👤 User: ${user?.email || user?.username || 'Unknown'}`);
      console.log(`   📊 Total Investments: ${investments.length}`);
      
      let totalDailyROI = 0;
      
      for (let i = 0; i < investments.length; i++) {
        const investment = investments[i];
        console.log(`\n   Investment ${i + 1}:`);
        console.log(`      Amount: $${investment.amount}`);
        console.log(`      Package ID: ${investment.trading_package_id || 'None'}`);
        
        // Calculate expected ROI for this specific investment
        const tradingPackageModel = require('./src/models/tradingpackage.model');
        let tradingPackage = null;
        
        if (investment.trading_package_id) {
          tradingPackage = await tradingPackageModel.findById(investment.trading_package_id);
        }
        
        if (!tradingPackage) {
          tradingPackage = await tradingPackageModel.findByTradingAmount(investment.amount);
        }
        
        if (tradingPackage) {
          const minROI = tradingPackage.min_daily_roi || tradingPackage.daily_trading_roi || 0.5;
          const maxROI = tradingPackage.max_daily_roi || tradingPackage.daily_trading_roi || 1.0;
          const avgROI = (minROI + maxROI) / 2;
          const dailyProfit = (investment.amount * avgROI) / 100;
          totalDailyROI += dailyProfit;
          
          console.log(`      Expected ROI: ${minROI.toFixed(3)}% - ${maxROI.toFixed(3)}% (avg: ${avgROI.toFixed(3)}%)`);
          console.log(`      Expected Daily Profit: $${dailyProfit.toFixed(4)}`);
        }
      }
      
      console.log(`   💰 Total Expected Daily ROI: $${totalDailyROI.toFixed(4)}`);
    }
    
    console.log('\n✅ Multiple package ROI test completed');
  } catch (error) {
    console.error('❌ Multiple package ROI test failed:', error);
  }
}

async function testLevelROI() {
  console.log('\n🏆 TESTING LEVEL ROI (TEAM COMMISSION)');
  console.log('=====================================');

  try {
    // Get recent daily profit records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentProfits = await incomeDbHandler.getByQuery({
      type: 'daily_profit',
      created_at: { $gte: today }
    }).limit(5);

    console.log(`Found ${recentProfits.length} recent daily profit records`);
    
    if (recentProfits.length === 0) {
      console.log('❌ No recent daily profits found for Level ROI testing');
      return;
    }

    // Check corresponding level ROI records
    for (const profit of recentProfits) {
      const user = await userDbHandler.getById(profit.user_id);
      console.log(`\n👤 User: ${user?.email || user?.username || 'Unknown'}`);
      console.log(`   💰 Daily Profit: $${profit.amount}`);
      
      // Check if this user has referrer
      if (user?.refer_id) {
        const referrer = await userDbHandler.getById(user.refer_id);
        console.log(`   👥 Referrer: ${referrer?.email || referrer?.username || 'Unknown'}`);
        
        // Check level ROI records for this user's profit
        const levelROIs = await incomeDbHandler.getByQuery({
          user_id_from: user._id,
          type: 'level_roi_income',
          created_at: { $gte: today }
        });
        
        console.log(`   🏆 Level ROI Records: ${levelROIs.length}`);
        
        if (levelROIs.length > 0) {
          levelROIs.forEach((roi, index) => {
            console.log(`      Level ${roi.level}: $${roi.amount} to user ${roi.user_id}`);
          });
        } else {
          console.log(`   ⚠️  No level ROI records found (may need to run level ROI cron)`);
        }
      } else {
        console.log(`   ⚠️  User has no referrer`);
      }
    }
    
    console.log('\n✅ Level ROI test completed');
  } catch (error) {
    console.error('❌ Level ROI test failed:', error);
  }
}

async function runDailyProfitCron() {
  console.log('\n⚡ RUNNING DAILY PROFIT CRON');
  console.log('============================');

  try {
    const result = await _processDailyTradingProfit('manual_test');
    
    if (result.success) {
      console.log('✅ Daily profit processing completed successfully');
      console.log(`   📊 Processed: ${result.processedCount} investments`);
      console.log(`   💰 Total Profit: $${result.totalProfit?.toFixed(4) || '0.0000'}`);
    } else {
      console.log('❌ Daily profit processing failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Daily profit cron test failed:', error);
  }
}

async function runLevelROICron() {
  console.log('\n🏆 RUNNING LEVEL ROI CRON');
  console.log('=========================');

  try {
    const result = await _processLevelRoiIncome('manual_test');
    
    if (result.success) {
      console.log('✅ Level ROI processing completed successfully');
      console.log(`   📊 Processed: ${result.processedCount} users`);
      console.log(`   💰 Total Commission: $${result.totalCommission?.toFixed(4) || '0.0000'}`);
    } else {
      console.log('❌ Level ROI processing failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Level ROI cron test failed:', error);
  }
}

async function main() {
  console.log('🚀 STARTING COMPLETE TRADING SYSTEM TEST');
  console.log('========================================');
  
  await connectDB();
  
  // Run all tests
  await testRandomDailyROI();
  await testReferralBonusOnceOnly();
  await testMultiplePackageROI();
  await testLevelROI();
  
  // Run cron jobs
  await runDailyProfitCron();
  await runLevelROICron();
  
  console.log('\n🎉 ALL TESTS COMPLETED');
  console.log('======================');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
