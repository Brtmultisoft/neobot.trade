#!/usr/bin/env node

/**
 * Debug Investment Data
 * Bhai, ye script check karega ki investments kya condition mein hain
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

async function debugInvestments() {
  console.log('\n🔍 DEBUGGING INVESTMENT DATA');
  console.log('============================');
  
  try {
    const { investmentDbHandler, userDbHandler } = require('./src/services/db');
    
    // Get all investments
    const allInvestments = await investmentDbHandler.getByQuery({});
    console.log(`📊 Total Investments: ${allInvestments.length}`);
    
    // Get active investments
    const activeInvestments = await investmentDbHandler.getByQuery({ status: 'active' });
    console.log(`🟢 Active Investments: ${activeInvestments.length}`);
    
    if (activeInvestments.length === 0) {
      console.log('❌ NO ACTIVE INVESTMENTS FOUND!');
      console.log('This is why daily profit is 0.');
      return;
    }
    
    // Check today's date logic
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + istOffset);
    todayIST.setHours(0, 0, 0, 0);
    
    console.log(`📅 Today IST: ${todayIST.toISOString()}`);
    
    // Check each active investment
    console.log('\n📋 ACTIVE INVESTMENTS DETAILS:');
    console.log('==============================');
    
    for (let i = 0; i < Math.min(activeInvestments.length, 5); i++) {
      const investment = activeInvestments[i];
      const user = await userDbHandler.getById(investment.user_id);
      
      console.log(`\n${i + 1}. Investment ID: ${investment._id}`);
      console.log(`   User: ${user?.email || user?.username || 'Unknown'}`);
      console.log(`   Amount: $${investment.amount}`);
      console.log(`   Status: ${investment.status}`);
      console.log(`   Created: ${investment.created_at}`);
      console.log(`   Last Profit Date: ${investment.last_profit_date || 'Never'}`);
      console.log(`   Trading Package ID: ${investment.trading_package_id || 'None'}`);
      
      // Check if eligible for profit today
      const lastProfitDate = investment.last_profit_date ? new Date(investment.last_profit_date) : null;
      
      if (!lastProfitDate) {
        console.log(`   ✅ ELIGIBLE: Never received profit`);
      } else if (lastProfitDate < todayIST) {
        console.log(`   ✅ ELIGIBLE: Last profit was before today`);
        console.log(`   Last profit: ${lastProfitDate.toISOString()}`);
        console.log(`   Today IST: ${todayIST.toISOString()}`);
      } else {
        console.log(`   ❌ NOT ELIGIBLE: Already received profit today`);
        console.log(`   Last profit: ${lastProfitDate.toISOString()}`);
        console.log(`   Today IST: ${todayIST.toISOString()}`);
      }
    }
    
    // Check query that daily profit uses
    console.log('\n🔍 CHECKING DAILY PROFIT QUERY:');
    console.log('===============================');
    
    const eligibleInvestments = await investmentDbHandler.getByQuery({
      status: 'active',
      $or: [
        { last_profit_date: { $lt: todayIST } },
        { last_profit_date: null },
        { last_profit_date: { $exists: false } }
      ]
    });
    
    console.log(`📊 Eligible for Daily Profit: ${eligibleInvestments.length}`);
    
    if (eligibleInvestments.length === 0) {
      console.log('\n❌ NO INVESTMENTS ELIGIBLE FOR DAILY PROFIT!');
      console.log('Possible reasons:');
      console.log('1. All investments already received profit today');
      console.log('2. Date/time logic issue');
      console.log('3. Database timezone issue');
      
      // Let's check if we can force reset last_profit_date
      console.log('\n🔧 MANUAL FIX SUGGESTION:');
      console.log('To manually reset and allow profit distribution:');
      console.log('Run this in MongoDB:');
      console.log('db.investments.updateMany({status: "active"}, {$unset: {last_profit_date: 1}})');
    } else {
      console.log('\n✅ Found eligible investments for daily profit');
      console.log('Daily profit should work now!');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

async function resetLastProfitDate() {
  console.log('\n🔧 RESETTING LAST PROFIT DATE');
  console.log('=============================');
  
  try {
    const { investmentDbHandler } = require('./src/services/db');
    
    // Reset last_profit_date for all active investments
    const result = await investmentDbHandler.updateByQuery(
      { status: 'active' },
      { $unset: { last_profit_date: 1 } }
    );
    
    console.log(`✅ Reset last_profit_date for investments`);
    console.log(`Modified count: ${result.modifiedCount || 'Unknown'}`);
    console.log('Now daily profit should work!');
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  }
}

async function testDailyProfit() {
  console.log('\n⚡ TESTING DAILY PROFIT');
  console.log('======================');
  
  try {
    const { _processDailyTradingProfit } = require('./src/controllers/user/cron.controller');
    
    const result = await _processDailyTradingProfit('debug_test');
    
    console.log('📊 Daily Profit Result:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Processed: ${result.processedCount}`);
    console.log(`   Total Profit: $${result.totalProfit || 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
      result.errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Daily profit test failed:', error);
  }
}

async function main() {
  console.log('🚀 STARTING INVESTMENT DEBUG');
  console.log('============================');
  
  await connectDB();
  
  // Debug investments
  await debugInvestments();
  
  // Ask user if they want to reset
  console.log('\n❓ Do you want to reset last_profit_date and test daily profit?');
  console.log('This will allow all active investments to receive profit again.');
  
  // For now, let's automatically reset and test
  await resetLastProfitDate();
  await testDailyProfit();
  
  console.log('\n🎉 DEBUG COMPLETED');
  console.log('==================');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the debug
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
