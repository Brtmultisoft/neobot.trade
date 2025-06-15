require('dotenv').config();
const mongoose = require('mongoose');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/neobot');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample rewards with dummy user IDs
const createSampleRewards = async () => {
  try {
    // Import models
    const Reward = require('./src/models/reward.model');

    // Check if rewards already exist
    const existingRewards = await Reward.find();
    
    if (existingRewards.length > 0) {
      console.log(`✅ Found ${existingRewards.length} existing rewards`);
      
      // Display existing rewards
      console.log('\n🏆 Existing Rewards:');
      existingRewards.forEach((reward, index) => {
        console.log(`   ${index + 1}. ${reward.reward_name} - ${reward.status} (${reward.reward_type})`);
      });
      
      return;
    }

    console.log('Creating sample rewards with dummy user IDs...');
    
    // Create dummy ObjectIds for users
    const dummyUserIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ];

    // Updated sample rewards with OR logic (either target can qualify)
    const sampleRewards = [
      {
        user_id: dummyUserIds[0],
        reward_type: 'goa_tour',
        reward_name: 'Goa Tour',
        self_invest_target: 1000,
        self_invest_achieved: 1200, // ✅ Self investment complete (qualifies)
        direct_business_target: 1500,
        direct_business_achieved: 800, // ❌ Direct business incomplete (but still qualifies due to OR logic)
        qualification_date: new Date(),
        status: 'qualified',
        reward_value: 'Goa Tour Package'
      },
      {
        user_id: dummyUserIds[1],
        reward_type: 'bangkok_tour',
        reward_name: 'Bangkok Tour',
        self_invest_target: 5000,
        self_invest_achieved: 3000, // ❌ Self investment incomplete
        direct_business_target: 10000,
        direct_business_achieved: 12000, // ✅ Direct business complete (qualifies)
        qualification_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'approved',
        reward_value: 'Bangkok Tour Package'
      },
      {
        user_id: dummyUserIds[2],
        reward_type: 'goa_tour',
        reward_name: 'Goa Tour',
        self_invest_target: 1000,
        self_invest_achieved: 800, // ❌ Self investment incomplete
        direct_business_target: 1500,
        direct_business_achieved: 1600, // ✅ Direct business complete (qualifies)
        qualification_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'qualified',
        reward_value: 'Goa Tour Package'
      },
      {
        user_id: dummyUserIds[3],
        reward_type: 'bangkok_tour',
        reward_name: 'Bangkok Tour',
        self_invest_target: 5000,
        self_invest_achieved: 6000, // ✅ Self investment complete (qualifies)
        direct_business_target: 10000,
        direct_business_achieved: 8000, // ❌ Direct business incomplete (but still qualifies due to OR logic)
        qualification_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'processed',
        reward_value: 'Bangkok Tour Package'
      },
      {
        user_id: dummyUserIds[0],
        reward_type: 'goa_tour',
        reward_name: 'Goa Tour',
        self_invest_target: 1000,
        self_invest_achieved: 1100, // ✅ Self investment complete
        direct_business_target: 1500,
        direct_business_achieved: 1700, // ✅ Direct business complete (both complete)
        qualification_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
        reward_value: 'Goa Tour Package'
      },
      {
        user_id: dummyUserIds[1],
        reward_type: 'goa_tour',
        reward_name: 'Goa Tour',
        self_invest_target: 1000,
        self_invest_achieved: 600, // ❌ Self investment incomplete
        direct_business_target: 1500,
        direct_business_achieved: 900, // ❌ Direct business incomplete (NOT qualified)
        qualification_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'qualified', // This one shouldn't actually qualify with new logic
        reward_value: 'Goa Tour Package'
      }
    ];

    const createdRewards = await Reward.insertMany(sampleRewards);
    console.log(`✅ Created ${createdRewards.length} sample rewards`);

    // Display summary
    const totalRewards = await Reward.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Total Rewards: ${totalRewards}`);
    
    // Display rewards by status
    const rewardsByStatus = await Reward.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n🏆 Rewards by Status:');
    rewardsByStatus.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    // Display rewards by type
    const rewardsByType = await Reward.aggregate([
      {
        $group: {
          _id: '$reward_type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n🎯 Rewards by Type:');
    rewardsByType.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n✅ Sample reward data creation completed!');
    console.log('You can now test the admin reward tracking system.');
    console.log('\nTo test the API:');
    console.log('1. Start the server: npm start');
    console.log('2. Navigate to /reward-test in the admin panel');
    console.log('3. Or navigate to /rewards for the full interface');

  } catch (error) {
    console.error('❌ Error creating sample rewards:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createSampleRewards();
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
