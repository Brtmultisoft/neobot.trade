#!/usr/bin/env node

/**
 * Seed Rewards Script
 * Bhai, ye script rewards seed karega properly
 */

require('dotenv').config();
const mongoose = require('mongoose');

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

async function seedRewards() {
  console.log('\n🌱 SEEDING REWARDS DATA');
  console.log('=======================');
  
  try {
    const rewardSeeder = require('./src/seeders/reward.seeder');
    
    console.log('🔄 Starting reward seeding process...');
    const result = await rewardSeeder.seedRewards();
    
    if (result.success) {
      console.log('✅ Reward seeding completed successfully!');
      console.log(`📊 Total Rewards Created: ${result.data.totalRewards}`);
      console.log(`👥 Users Created: ${result.data.usersCreated}`);
      console.log(`👤 Total Users: ${result.data.totalUsers}`);
      
      if (result.data.statusBreakdown && result.data.statusBreakdown.length > 0) {
        console.log('\n📈 Status Breakdown:');
        result.data.statusBreakdown.forEach(status => {
          console.log(`   ${status._id}: ${status.count} rewards`);
        });
      }
      
      // Get additional stats
      const stats = await rewardSeeder.getRewardStats();
      console.log('\n📊 Reward Statistics:');
      console.log(`   Total Rewards: ${stats.totalRewards}`);
      
      if (stats.typeStats && stats.typeStats.length > 0) {
        console.log('\n🎁 Reward Types:');
        stats.typeStats.forEach(type => {
          console.log(`   ${type._id}: ${type.count} rewards`);
        });
      }
      
    } else {
      console.log('❌ Reward seeding failed');
      console.log(`Error: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Reward seeding failed:', error);
  }
}

async function showRewardTargets() {
  console.log('\n🎯 REWARD TARGETS (Business Requirements)');
  console.log('=========================================');
  
  const rewardTargets = [
    {
      ser_no: 1,
      reward: "Goa Tour",
      self_invest: "$1000",
      target_business: "$1500",
      remarks: ""
    },
    {
      ser_no: 2,
      reward: "Bangkok Tour",
      self_invest: "$2500",
      target_business: "$5000",
      remarks: ""
    },
    {
      ser_no: 3,
      reward: "Coupon code",
      self_invest: "$500",
      target_business: "$800",
      remarks: ""
    },
    {
      ser_no: 4,
      reward: "Car",
      self_invest: "$10000",
      target_business: "$5000 Monthly Business every month",
      remarks: ""
    },
    {
      ser_no: 5,
      reward: "Book Your Bike",
      self_invest: "$7000",
      target_business: "$4000",
      remarks: ""
    }
  ];
  
  rewardTargets.forEach(reward => {
    console.log(`${reward.ser_no}. ${reward.reward}`);
    console.log(`   Self Investment: ${reward.self_invest}`);
    console.log(`   Target Business: ${reward.target_business}`);
    if (reward.remarks) {
      console.log(`   Remarks: ${reward.remarks}`);
    }
    console.log('');
  });
}

async function main() {
  console.log('🚀 STARTING REWARD SEEDING PROCESS');
  console.log('==================================');
  
  await connectDB();
  await showRewardTargets();
  await seedRewards();
  
  console.log('\n🎉 REWARD SEEDING COMPLETED');
  console.log('===========================');
  console.log('Bhai, rewards seed ho gaye! Admin panel mein check kar sakte hain.');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the seeder
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
