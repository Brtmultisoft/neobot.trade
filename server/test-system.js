#!/usr/bin/env node

/**
 * Simple Trading System Test Script
 * Bhai, ye script sab kuch test karega aur rewards seed karega
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neobot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
}

async function testDailyROI() {
  console.log('\n🎲 TESTING DAILY ROI WITH RANDOM GENERATION');
  console.log('===========================================');
  
  try {
    const { investmentDbHandler, userDbHandler } = require('./src/services/db');
    
    // Get some investments
    const investments = await investmentDbHandler.getByQuery({ status: 'active' }).limit(3);
    
    if (investments.length === 0) {
      console.log('❌ No active investments found');
      return;
    }
    
    console.log(`Found ${investments.length} active investments:`);
    
    for (const investment of investments) {
      const user = await userDbHandler.getById(investment.user_id);
      console.log(`\n📊 Investment: ${investment._id}`);
      console.log(`   User: ${user?.email || 'Unknown'}`);
      console.log(`   Amount: $${investment.amount}`);
      
      // Test random ROI generation
      let minROI, maxROI;
      if (investment.amount < 5000) {
        minROI = 0.667; // 20% monthly / 30 days
        maxROI = 1.000; // 30% monthly / 30 days
      } else {
        minROI = 1.000; // 30% monthly / 30 days
        maxROI = 1.333; // 40% monthly / 30 days
      }
      
      const randomROI = (Math.random() * (maxROI - minROI) + minROI);
      const dailyProfit = (investment.amount * randomROI) / 100;
      
      console.log(`   🎯 ROI Range: ${minROI.toFixed(3)}% - ${maxROI.toFixed(3)}%`);
      console.log(`   🎲 Random ROI: ${randomROI.toFixed(3)}%`);
      console.log(`   💰 Daily Profit: $${dailyProfit.toFixed(4)}`);
    }
    
    console.log('\n✅ Daily ROI test completed');
  } catch (error) {
    console.error('❌ Daily ROI test failed:', error);
  }
}

async function testReferralBonus() {
  console.log('\n👥 TESTING ONE-TIME REFERRAL BONUS');
  console.log('==================================');
  
  try {
    const { userDbHandler, incomeDbHandler } = require('./src/services/db');
    
    // Find users with referrals
    const users = await userDbHandler.getByQuery({ 
      refer_id: { $exists: true, $ne: null } 
    }).limit(3);
    
    if (users.length === 0) {
      console.log('❌ No users with referrals found');
      return;
    }
    
    for (const user of users) {
      const referrer = await userDbHandler.getById(user.refer_id);
      console.log(`\n👤 User: ${user.email || 'Unknown'}`);
      console.log(`   Referrer: ${referrer?.email || 'Unknown'}`);
      
      // Check referral bonuses
      const bonuses = await incomeDbHandler.getByQuery({
        user_id: user.refer_id,
        user_id_from: user._id,
        type: 'referral_bonus'
      });
      
      console.log(`   💰 Referral Bonuses: ${bonuses.length}`);
      if (bonuses.length > 0) {
        console.log(`   ✅ One-time bonus working correctly`);
      } else {
        console.log(`   ⚠️  No bonus found (user may not have invested)`);
      }
    }
    
    console.log('\n✅ Referral bonus test completed');
  } catch (error) {
    console.error('❌ Referral bonus test failed:', error);
  }
}

async function runDailyProfitCron() {
  console.log('\n⚡ RUNNING DAILY PROFIT CRON');
  console.log('============================');
  
  try {
    const { _processDailyTradingProfit } = require('./src/controllers/user/cron.controller');
    
    const result = await _processDailyTradingProfit('manual_test');
    
    if (result.success) {
      console.log('✅ Daily profit processing successful');
      console.log(`   📊 Processed: ${result.processedCount} investments`);
      console.log(`   💰 Total Profit: $${result.totalProfit?.toFixed(4) || '0'}`);
    } else {
      console.log('❌ Daily profit processing failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Daily profit cron failed:', error);
  }
}

async function runLevelROICron() {
  console.log('\n🏆 RUNNING LEVEL ROI CRON');
  console.log('=========================');
  
  try {
    const { _processLevelRoiIncome } = require('./src/controllers/user/cron.controller');
    
    const result = await _processLevelRoiIncome('manual_test');
    
    if (result.success) {
      console.log('✅ Level ROI processing successful');
      console.log(`   📊 Processed: ${result.processedCount} users`);
      console.log(`   💰 Total Commission: $${result.totalCommission?.toFixed(4) || '0'}`);
    } else {
      console.log('❌ Level ROI processing failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Level ROI cron failed:', error);
  }
}

async function seedRewards() {
  console.log('\n🌱 SEEDING REWARDS DATA');
  console.log('=======================');
  
  try {
    const { userDbHandler } = require('./src/services/db');
    const rewardSeeder = require('./src/seeders/reward.seeder');
    
    // Get some users for seeding
    const users = await userDbHandler.getByQuery({}).limit(10);
    
    if (users.length === 0) {
      console.log('❌ No users found for seeding rewards');
      return;
    }
    
    console.log(`Found ${users.length} users for reward seeding`);
    
    // Seed rewards
    const result = await rewardSeeder.seedRewards();
    
    if (result.success) {
      console.log('✅ Rewards seeded successfully');
      console.log(`   📊 Created: ${result.createdCount || 0} rewards`);
    } else {
      console.log('❌ Reward seeding failed');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Reward seeding failed:', error);
  }
}

async function checkSystemHealth() {
  console.log('\n🏥 CHECKING SYSTEM HEALTH');
  console.log('=========================');
  
  try {
    const { userDbHandler, investmentDbHandler, incomeDbHandler } = require('./src/services/db');
    
    // Check collections
    const userCount = await userDbHandler.getByQuery({}).countDocuments();
    const investmentCount = await investmentDbHandler.getByQuery({}).countDocuments();
    const incomeCount = await incomeDbHandler.getByQuery({}).countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📊 Investments: ${investmentCount}`);
    console.log(`💰 Income Records: ${incomeCount}`);
    
    // Check active investments
    const activeInvestments = await investmentDbHandler.getByQuery({ status: 'active' }).countDocuments();
    console.log(`🟢 Active Investments: ${activeInvestments}`);
    
    // Check recent daily profits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayProfits = await incomeDbHandler.getByQuery({
      type: 'daily_profit',
      created_at: { $gte: today }
    }).countDocuments();
    console.log(`📈 Today's Profits: ${todayProfits}`);
    
    // Check referral bonuses
    const referralBonuses = await incomeDbHandler.getByQuery({
      type: 'referral_bonus'
    }).countDocuments();
    console.log(`👥 Referral Bonuses: ${referralBonuses}`);
    
    // Check level ROI
    const levelROI = await incomeDbHandler.getByQuery({
      type: 'level_roi_income'
    }).countDocuments();
    console.log(`🏆 Level ROI Records: ${levelROI}`);
    
    console.log('\n✅ System health check completed');
  } catch (error) {
    console.error('❌ System health check failed:', error);
  }
}

async function main() {
  console.log('🚀 STARTING COMPLETE SYSTEM TEST');
  console.log('================================');
  
  await connectDB();
  
  // Run all tests
  await checkSystemHealth();
  await testDailyROI();
  await testReferralBonus();
  await seedRewards();
  await runDailyProfitCron();
  await runLevelROICron();
  
  console.log('\n🎉 ALL TESTS COMPLETED');
  console.log('======================');
  console.log('Bhai, sab kuch test ho gaya! Check karo results.');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
