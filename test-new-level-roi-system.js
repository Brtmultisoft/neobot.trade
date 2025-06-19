// Test script for the new Level ROI system
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function testNewLevelROISystem() {
  console.log('\n🧪 TESTING NEW LEVEL ROI SYSTEM');
  console.log('===============================');
  
  try {
    // Import required models and handlers
    const { userDbHandler, incomeDbHandler } = require('./server/src/services/db');
    const { processTeamCommission } = require('./server/src/controllers/user/cron.controller');
    
    // Get some test users with different direct referral counts
    const users = await userDbHandler.getByQuery(
      { total_investment: { $gt: 0 } },
      { _id: 1, email: 1, username: 1, total_investment: 1, refer_id: 1 }
    );
    
    console.log(`Found ${users.length} users with investments`);
    
    // Test with first few users
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      console.log(`\n--- Testing User ${i + 1}: ${user.email || user.username} ---`);
      
      // Get direct referrals count
      const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });
      console.log(`Direct referrals: ${directReferrals.length}`);
      
      // Simulate daily profit amount
      const dailyProfitAmount = 50; // $50 daily profit
      
      console.log(`Simulating level ROI processing for $${dailyProfitAmount} daily profit...`);
      
      // Test the new level ROI logic
      try {
        const result = await processTeamCommission(user._id, dailyProfitAmount);
        console.log(`Level ROI processing result: ${result ? 'Success' : 'Failed'}`);
        
        // Check what level ROI records were created today
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const todayIST = new Date(today.getTime() + istOffset);
        todayIST.setHours(0, 0, 0, 0);
        
        const todaysLevelROI = await incomeDbHandler.getByQuery({
          user_id_from: user._id,
          type: 'level_roi_income',
          created_at: {
            $gte: todayIST,
            $lt: new Date(todayIST.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        console.log(`Level ROI records created today: ${todaysLevelROI.length}`);
        
        if (todaysLevelROI.length > 0) {
          console.log('Level ROI details:');
          todaysLevelROI.forEach((roi, index) => {
            console.log(`  Level ${roi.level}: $${roi.amount.toFixed(4)} to user ${roi.user_id}`);
            if (roi.extra) {
              console.log(`    Direct referrals: ${roi.extra.directReferralsCount}`);
              console.log(`    Required: ${roi.extra.requiredDirectReferrals}`);
              console.log(`    Max eligible level: ${roi.extra.maxEligibleLevel}`);
            }
          });
        }
        
      } catch (error) {
        console.error(`Error processing level ROI for user ${user._id}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testLevelEligibilityLogic() {
  console.log('\n🎯 TESTING LEVEL ELIGIBILITY LOGIC');
  console.log('==================================');
  
  try {
    const { userDbHandler } = require('./server/src/services/db');
    
    // Get users and check their eligibility
    const users = await userDbHandler.getByQuery(
      { total_investment: { $gt: 0 } },
      { _id: 1, email: 1, username: 1 }
    );
    
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      
      // Get direct referrals
      const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });
      const directCount = directReferrals.length;
      
      console.log(`\n${user.email || user.username}:`);
      console.log(`  Direct referrals: ${directCount}`);
      
      if (directCount === 0) {
        console.log(`  ❌ Not eligible for any level ROI`);
      } else {
        const maxEligibleLevel = Math.min(directCount, 10);
        console.log(`  ✅ Eligible for levels 1-${maxEligibleLevel}`);
        
        // Show level-by-level eligibility
        for (let level = 1; level <= 10; level++) {
          const eligible = level <= maxEligibleLevel;
          const status = eligible ? '✅' : '❌';
          console.log(`    Level ${level}: ${status}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Eligibility test failed:', error);
  }
}

async function main() {
  console.log('🚀 TESTING NEW LEVEL ROI SYSTEM');
  console.log('================================');
  
  await connectDB();
  
  // Run tests
  await testLevelEligibilityLogic();
  await testNewLevelROISystem();
  
  console.log('\n🎉 TESTING COMPLETED');
  console.log('====================');
  console.log('New Level ROI Rules:');
  console.log('1. User needs N direct referrals to get Level N ROI');
  console.log('2. Maximum 10 levels (even with 10+ direct referrals)');
  console.log('3. No direct referrals = No level ROI');
  console.log('4. Level ROI calculated from downline daily trading profit');
  
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
