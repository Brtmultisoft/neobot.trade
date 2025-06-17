#!/usr/bin/env node

/**
 * Quick Fix for Daily Profit Issue
 * Bhai, ye script daily profit issue fix karega
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neobot');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

async function fixDailyProfit() {
  try {
    console.log('🔧 FIXING DAILY PROFIT ISSUE');
    console.log('============================');
    
    // Get investment collection directly
    const Investment = mongoose.model('Investment', new mongoose.Schema({}, { strict: false }));
    
    // Check current investments
    const totalInvestments = await Investment.countDocuments();
    const activeInvestments = await Investment.countDocuments({ status: 'active' });
    
    console.log(`📊 Total Investments: ${totalInvestments}`);
    console.log(`🟢 Active Investments: ${activeInvestments}`);
    
    if (activeInvestments === 0) {
      console.log('❌ No active investments found!');
      return;
    }
    
    // Reset last_profit_date for all active investments
    console.log('\n🔄 Resetting last_profit_date...');
    const resetResult = await Investment.updateMany(
      { status: 'active' },
      { $unset: { last_profit_date: 1 } }
    );
    
    console.log(`✅ Reset ${resetResult.modifiedCount} investments`);
    
    // Check eligible investments after reset
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + istOffset);
    todayIST.setHours(0, 0, 0, 0);
    
    const eligibleCount = await Investment.countDocuments({
      status: 'active',
      $or: [
        { last_profit_date: { $lt: todayIST } },
        { last_profit_date: null },
        { last_profit_date: { $exists: false } }
      ]
    });
    
    console.log(`📈 Eligible for profit: ${eligibleCount}`);
    
    if (eligibleCount > 0) {
      console.log('✅ Daily profit should work now!');
      console.log('\nTry running the daily profit API again.');
    } else {
      console.log('❌ Still no eligible investments. Check date logic.');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

async function main() {
  await connectDB();
  await fixDailyProfit();
  await mongoose.disconnect();
  console.log('✅ Disconnected');
}

main().catch(console.error);
