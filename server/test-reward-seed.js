#!/usr/bin/env node

/**
 * Simple Reward Seeding Test
 * Bhai, ye script direct reward seed karega
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

async function testRewardSeeding() {
  try {
    console.log('🌱 TESTING REWARD SEEDING');
    console.log('=========================');
    
    // Import models directly
    const Reward = require('./src/models/reward.model');
    const User = require('./src/models/user.model');
    
    // Check current data
    const userCount = await User.countDocuments();
    const rewardCount = await Reward.countDocuments();
    
    console.log(`📊 Current Data:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Rewards: ${rewardCount}`);
    
    // Clear existing rewards
    if (rewardCount > 0) {
      console.log('🗑️  Clearing existing rewards...');
      await Reward.deleteMany({});
      console.log('✅ Cleared existing rewards');
    }
    
    // Get or create users
    let users = await User.find().limit(3);
    
    if (users.length === 0) {
      console.log('👥 Creating test users...');
      
      const testUsers = [];
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
          testUsers.push(user);
          console.log(`✅ Created user: ${user.email}`);
        } catch (error) {
          console.log(`⚠️  User ${i} might already exist: ${error.message}`);
        }
      }
      
      if (testUsers.length > 0) {
        users = testUsers;
      } else {
        users = await User.find().limit(3);
      }
    }
    
    console.log(`👥 Using ${users.length} users for reward seeding`);
    
    // Reward configurations
    const rewardTypes = [
      {
        ser_no: 1,
        type: 'goa_tour',
        name: 'Goa Tour',
        self_invest_target: 1000,
        direct_business_target: 1500,
        reward_value: 'Goa Tour Package'
      },
      {
        ser_no: 2,
        type: 'bangkok_tour',
        name: 'Bangkok Tour',
        self_invest_target: 2500,
        direct_business_target: 5000,
        reward_value: 'Bangkok Tour Package'
      },
      {
        ser_no: 3,
        type: 'coupon_code',
        name: 'Coupon code',
        self_invest_target: 500,
        direct_business_target: 800,
        reward_value: 'Special Coupon Code'
      },
      {
        ser_no: 4,
        type: 'car_reward',
        name: 'Car',
        self_invest_target: 10000,
        direct_business_target: 5000,
        reward_value: 'Car Reward'
      },
      {
        ser_no: 5,
        type: 'bike_reward',
        name: 'Book Your Bike',
        self_invest_target: 7000,
        direct_business_target: 4000,
        reward_value: 'Bike Booking Reward'
      }
    ];
    
    console.log('🎁 Creating rewards...');
    
    const rewards = [];
    const statuses = ['qualified', 'approved', 'processed', 'completed'];
    
    // Create rewards for each user
    for (const user of users) {
      for (const rewardType of rewardTypes) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate realistic progress values
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
          processed_at: ['processed', 'completed'].includes(status) ? new Date() : null,
          extra: {
            ser_no: rewardType.ser_no,
            self_invest_formatted: `$${rewardType.self_invest_target}`,
            target_business_formatted: `$${rewardType.direct_business_target}`,
            qualification_percentage: {
              self_invest: Math.round((selfInvestAchieved / rewardType.self_invest_target) * 100),
              direct_business: Math.round((directBusinessAchieved / rewardType.direct_business_target) * 100)
            }
          }
        };
        
        rewards.push(reward);
      }
    }
    
    // Insert rewards
    console.log(`💾 Inserting ${rewards.length} rewards...`);
    const insertedRewards = await Reward.insertMany(rewards);
    console.log(`✅ Successfully created ${insertedRewards.length} rewards`);
    
    // Get statistics
    const statusStats = await Reward.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const typeStats = await Reward.aggregate([
      {
        $group: {
          _id: '$reward_type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 REWARD STATISTICS:');
    console.log('====================');
    console.log(`Total Rewards: ${insertedRewards.length}`);
    
    console.log('\n📈 Status Breakdown:');
    statusStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🎁 Type Breakdown:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n✅ REWARD SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Bhai, rewards seed ho gaye! Admin panel mein check kar sakte hain.');
    
    return {
      success: true,
      totalRewards: insertedRewards.length,
      statusStats,
      typeStats
    };
    
  } catch (error) {
    console.error('❌ Reward seeding failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 STARTING REWARD SEEDING TEST');
  console.log('===============================');
  
  await connectDB();
  await testRewardSeeding();
  
  console.log('\n🎉 TEST COMPLETED');
  console.log('=================');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
