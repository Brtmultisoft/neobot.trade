#!/usr/bin/env node

/**
 * Quick Test for Level ROI and Rewards
 * Bhai, ye script quickly test karega
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

async function quickTest() {
  console.log('\n⚡ QUICK SYSTEM TEST');
  console.log('===================');
  
  try {
    const User = require('./src/models/user.model');
    const Income = require('./src/models/income.model');
    const Investment = require('./src/models/investment.model');
    const Reward = require('./src/models/reward.model');
    
    // Check basic data
    const userCount = await User.countDocuments();
    const investmentCount = await Investment.countDocuments();
    const incomeCount = await Income.countDocuments();
    const rewardCount = await Reward.countDocuments();
    
    console.log('📊 Database Status:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Investments: ${investmentCount}`);
    console.log(`   Income Records: ${incomeCount}`);
    console.log(`   Rewards: ${rewardCount}`);
    
    // Check daily profits today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProfits = await Income.countDocuments({
      type: 'daily_profit',
      created_at: { $gte: today }
    });
    
    const levelROIs = await Income.countDocuments({
      type: 'level_roi_income'
    });
    
    console.log('\n💰 Income Status:');
    console.log(`   Daily Profits Today: ${todayProfits}`);
    console.log(`   Level ROI Records: ${levelROIs}`);
    
    // Check referral chain
    const usersWithReferrers = await User.countDocuments({
      refer_id: { $exists: true, $ne: null }
    });
    
    const usersWithInvestments = await User.countDocuments({
      total_investment: { $gt: 0 }
    });
    
    console.log('\n👥 User Status:');
    console.log(`   Users with Referrers: ${usersWithReferrers}`);
    console.log(`   Users with Investments: ${usersWithInvestments}`);
    
    // Quick fixes
    console.log('\n🔧 APPLYING QUICK FIXES');
    console.log('=======================');
    
    // 1. Create test users if none exist
    if (userCount < 3) {
      console.log('👥 Creating test users...');
      
      for (let i = 1; i <= 3; i++) {
        try {
          const existingUser = await User.findOne({ email: `testuser${i}@example.com` });
          if (!existingUser) {
            const user = new User({
              username: `testuser${i}`,
              email: `testuser${i}@example.com`,
              password: 'testpassword123',
              total_investment: 1000 + (i * 500),
              wallet: 100 + (i * 50),
              status: true,
              phone_number: `+1234567890${i}`,
              sponsorID: `TEST${i.toString().padStart(3, '0')}`,
              refer_id: i > 1 ? null : null // Will set up chain below
            });
            await user.save();
            console.log(`✅ Created user: ${user.email}`);
          }
        } catch (error) {
          console.log(`⚠️  User ${i} creation failed: ${error.message}`);
        }
      }
      
      // Set up referral chain
      const users = await User.find({ email: /testuser/ }).sort({ email: 1 });
      if (users.length >= 2) {
        // testuser2 refers to testuser1, testuser3 refers to testuser2
        if (users[1]) {
          users[1].refer_id = users[0]._id;
          await users[1].save();
          console.log(`✅ Set referral: ${users[1].email} -> ${users[0].email}`);
        }
        if (users[2]) {
          users[2].refer_id = users[1]._id;
          await users[2].save();
          console.log(`✅ Set referral: ${users[2].email} -> ${users[1].email}`);
        }
      }
    }
    
    // 2. Create test investments if none exist
    if (investmentCount === 0) {
      console.log('💰 Creating test investments...');
      
      const users = await User.find().limit(3);
      for (const user of users) {
        try {
          const investment = new Investment({
            user_id: user._id,
            investment_plan_id: new mongoose.Types.ObjectId(),
            amount: user.total_investment || 1000,
            status: 'active',
            created_at: new Date()
          });
          await investment.save();
          console.log(`✅ Created investment: $${investment.amount} for ${user.email}`);
        } catch (error) {
          console.log(`⚠️  Investment creation failed: ${error.message}`);
        }
      }
    }
    
    // 3. Create test rewards if none exist
    if (rewardCount === 0) {
      console.log('🎁 Creating test rewards...');
      
      const users = await User.find().limit(2);
      const rewardTypes = [
        { type: 'goa_tour', name: 'Goa Tour', self_target: 1000, direct_target: 1500 },
        { type: 'bangkok_tour', name: 'Bangkok Tour', self_target: 2500, direct_target: 5000 }
      ];
      
      for (const user of users) {
        for (const rewardType of rewardTypes) {
          try {
            const reward = new Reward({
              user_id: user._id,
              reward_type: rewardType.type,
              reward_name: rewardType.name,
              self_invest_target: rewardType.self_target,
              self_invest_achieved: user.total_investment || 1000,
              direct_business_target: rewardType.direct_target,
              direct_business_achieved: Math.floor(Math.random() * rewardType.direct_target),
              qualification_date: new Date(),
              status: 'qualified',
              reward_value: `${rewardType.name} Package`
            });
            await reward.save();
            console.log(`✅ Created reward: ${rewardType.name} for ${user.email}`);
          } catch (error) {
            console.log(`⚠️  Reward creation failed: ${error.message}`);
          }
        }
      }
    }
    
    // 4. Test daily profit processing
    console.log('\n💰 Testing Daily Profit...');
    try {
      const { _processDailyTradingProfit } = require('./src/controllers/user/cron.controller');
      const result = await _processDailyTradingProfit('test');
      console.log(`✅ Daily Profit: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Processed: ${result.processedCount || 0}`);
      console.log(`   Total Profit: $${result.totalProfit || 0}`);
    } catch (error) {
      console.log(`❌ Daily Profit failed: ${error.message}`);
    }
    
    // 5. Test level ROI processing
    console.log('\n🏆 Testing Level ROI...');
    try {
      const { _processLevelRoiIncome } = require('./src/controllers/user/cron.controller');
      const result = await _processLevelRoiIncome('test');
      console.log(`✅ Level ROI: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Processed: ${result.processedCount || 0}`);
      console.log(`   Total Commission: $${result.totalCommission || 0}`);
    } catch (error) {
      console.log(`❌ Level ROI failed: ${error.message}`);
    }
    
    // Final status
    console.log('\n📊 FINAL STATUS');
    console.log('===============');
    
    const finalStats = {
      users: await User.countDocuments(),
      investments: await Investment.countDocuments(),
      dailyProfits: await Income.countDocuments({ type: 'daily_profit' }),
      levelROIs: await Income.countDocuments({ type: 'level_roi_income' }),
      rewards: await Reward.countDocuments()
    };
    
    console.log(`Users: ${finalStats.users}`);
    console.log(`Investments: ${finalStats.investments}`);
    console.log(`Daily Profits: ${finalStats.dailyProfits}`);
    console.log(`Level ROIs: ${finalStats.levelROIs}`);
    console.log(`Rewards: ${finalStats.rewards}`);
    
    console.log('\n✅ QUICK TEST COMPLETED!');
    console.log('Bhai, systems test ho gaye! Admin panel check karo.');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

async function main() {
  console.log('🚀 QUICK SYSTEM TEST');
  console.log('====================');
  
  await connectDB();
  await quickTest();
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
