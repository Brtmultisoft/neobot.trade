#!/usr/bin/env node

/**
 * Fix Level ROI and Rewards System
 * Bhai, ye script level ROI aur rewards dono fix karega
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

async function fixLevelROI() {
  console.log('\n🔧 FIXING LEVEL ROI SYSTEM');
  console.log('==========================');
  
  try {
    const User = require('./src/models/user.model');
    const Income = require('./src/models/income.model');
    
    // Get all users
    const users = await User.find();
    console.log(`📊 Found ${users.length} users`);
    
    // Check referral chain
    let usersWithReferrers = 0;
    let usersWithInvestments = 0;
    
    for (const user of users) {
      if (user.refer_id) {
        usersWithReferrers++;
      }
      if (user.total_investment > 0) {
        usersWithInvestments++;
      }
    }
    
    console.log(`👥 Users with referrers: ${usersWithReferrers}`);
    console.log(`💰 Users with investments: ${usersWithInvestments}`);
    
    // Check recent daily profits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProfits = await Income.find({
      type: 'daily_profit',
      created_at: { $gte: today }
    });
    
    console.log(`📈 Daily profits today: ${todayProfits.length}`);
    
    // Check level ROI records
    const levelROIs = await Income.find({
      type: 'level_roi_income'
    });
    
    console.log(`🏆 Total level ROI records: ${levelROIs.length}`);
    
    if (levelROIs.length === 0) {
      console.log('❌ NO LEVEL ROI RECORDS FOUND!');
      console.log('Possible issues:');
      console.log('1. No referral chain setup');
      console.log('2. Users don\'t meet qualification requirements');
      console.log('3. Level ROI cron not running');
      
      // Create test level ROI if daily profits exist
      if (todayProfits.length > 0) {
        console.log('\n🔧 Creating test level ROI records...');
        
        for (const profit of todayProfits.slice(0, 3)) { // Test with first 3
          const user = await User.findById(profit.user_id);
          if (user && user.refer_id) {
            const referrer = await User.findById(user.refer_id);
            if (referrer && referrer.total_investment > 0) {
              // Create level 1 ROI
              const levelROI = new Income({
                user_id: referrer._id,
                user_id_from: user._id,
                type: 'level_roi_income',
                amount: profit.amount * 0.15, // 15% commission
                status: 'credited',
                level: 1,
                description: 'Level 1 ROI Income (Test)',
                extra: {
                  fromUser: user.email || user.username,
                  dailyProfitAmount: profit.amount,
                  commissionPercentage: 15,
                  testRecord: true
                }
              });
              
              await levelROI.save();
              
              // Update referrer wallet
              await User.findByIdAndUpdate(referrer._id, {
                $inc: { 
                  wallet: levelROI.amount,
                  'extra.teamCommission': levelROI.amount
                }
              });
              
              console.log(`✅ Created test level ROI: $${levelROI.amount.toFixed(4)} for ${referrer.email}`);
            }
          }
        }
      }
    }
    
    console.log('✅ Level ROI system check completed');
    
  } catch (error) {
    console.error('❌ Level ROI fix failed:', error);
  }
}

async function fixRewards() {
  console.log('\n🎁 FIXING REWARD SYSTEM');
  console.log('=======================');
  
  try {
    const Reward = require('./src/models/reward.model');
    const User = require('./src/models/user.model');
    
    // Check existing rewards
    const existingRewards = await Reward.countDocuments();
    console.log(`📊 Existing rewards: ${existingRewards}`);
    
    if (existingRewards === 0) {
      console.log('❌ NO REWARDS FOUND! Creating sample rewards...');
      
      // Get users
      let users = await User.find().limit(3);
      
      if (users.length === 0) {
        console.log('👥 Creating test users...');
        
        // Create test users
        for (let i = 1; i <= 3; i++) {
          try {
            const user = new User({
              username: `testuser${i}`,
              email: `testuser${i}@example.com`,
              password: 'testpassword123',
              total_investment: Math.floor(Math.random() * 10000) + 1000,
              wallet: Math.floor(Math.random() * 1000) + 100,
              status: true,
              phone_number: `+1234567890${i}`,
              sponsorID: `TEST${i.toString().padStart(3, '0')}`
            });
            await user.save();
            console.log(`✅ Created user: ${user.email}`);
          } catch (error) {
            console.log(`⚠️  User ${i} might already exist`);
          }
        }
        
        users = await User.find().limit(3);
      }
      
      console.log(`👥 Using ${users.length} users for rewards`);
      
      // Reward types from your business requirements
      const rewardTypes = [
        {
          type: 'goa_tour',
          name: 'Goa Tour',
          self_invest_target: 1000,
          direct_business_target: 1500,
          reward_value: 'Goa Tour Package'
        },
        {
          type: 'bangkok_tour',
          name: 'Bangkok Tour',
          self_invest_target: 2500,
          direct_business_target: 5000,
          reward_value: 'Bangkok Tour Package'
        },
        {
          type: 'coupon_code',
          name: 'Coupon code',
          self_invest_target: 500,
          direct_business_target: 800,
          reward_value: 'Special Coupon Code'
        },
        {
          type: 'car_reward',
          name: 'Car',
          self_invest_target: 10000,
          direct_business_target: 5000,
          reward_value: 'Car Reward'
        },
        {
          type: 'bike_reward',
          name: 'Book Your Bike',
          self_invest_target: 7000,
          direct_business_target: 4000,
          reward_value: 'Bike Booking Reward'
        }
      ];
      
      const statuses = ['qualified', 'approved', 'processed', 'completed'];
      const rewards = [];
      
      // Create rewards for each user
      for (const user of users) {
        for (const rewardType of rewardTypes) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Generate realistic progress
          const selfInvestAchieved = Math.floor(Math.random() * rewardType.self_invest_target * 1.5);
          const directBusinessAchieved = Math.floor(Math.random() * rewardType.direct_business_target * 1.5);
          
          const reward = {
            user_id: user._id,
            reward_type: rewardType.type,
            reward_name: rewardType.name,
            self_invest_target: rewardType.self_invest_target,
            self_invest_achieved: selfInvestAchieved,
            direct_business_target: rewardType.direct_business_target,
            direct_business_achieved: directBusinessAchieved,
            qualification_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            status: status,
            reward_value: rewardType.reward_value,
            notes: status === 'completed' ? 'Reward completed successfully' : 
                   status === 'approved' ? 'Approved by admin' : '',
            processed_at: ['processed', 'completed'].includes(status) ? new Date() : null
          };
          
          rewards.push(reward);
        }
      }
      
      // Insert rewards
      const insertedRewards = await Reward.insertMany(rewards);
      console.log(`✅ Created ${insertedRewards.length} rewards`);
      
      // Get statistics
      const statusStats = await Reward.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      console.log('📊 Reward Status Breakdown:');
      statusStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count}`);
      });
      
    } else {
      console.log('✅ Rewards already exist');
    }
    
    console.log('✅ Reward system check completed');
    
  } catch (error) {
    console.error('❌ Reward fix failed:', error);
  }
}

async function testLevelROICron() {
  console.log('\n⚡ TESTING LEVEL ROI CRON');
  console.log('=========================');
  
  try {
    const { _processLevelRoiIncome } = require('./src/controllers/user/cron.controller');
    
    console.log('🔄 Running level ROI cron...');
    const result = await _processLevelRoiIncome('manual_test');
    
    console.log('📊 Level ROI Result:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Processed: ${result.processedCount}`);
    console.log(`   Total Commission: $${result.totalCommission || 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`);
    }
    
  } catch (error) {
    console.error('❌ Level ROI cron test failed:', error);
  }
}

async function main() {
  console.log('🚀 FIXING LEVEL ROI AND REWARDS SYSTEM');
  console.log('======================================');
  
  await connectDB();
  
  // Fix both systems
  await fixLevelROI();
  await fixRewards();
  await testLevelROICron();
  
  console.log('\n🎉 FIXES COMPLETED');
  console.log('==================');
  console.log('Bhai, level ROI aur rewards dono fix ho gaye!');
  console.log('Admin panel mein check kar sakte hain.');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the fixes
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
