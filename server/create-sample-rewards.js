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

// Create sample data
const createSampleData = async () => {
  try {
    // Import models
    const User = require('./src/models/user.model');
    const Reward = require('./src/models/reward.model');

    // Create sample users if they don't exist
    let users = await User.find().limit(3);
    
    if (users.length === 0) {
      console.log('Creating sample users...');
      const sampleUsers = [
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: 'password123', // Will be hashed by pre-save middleware
          total_investment: 1500,
          wallet: 100, // wallet is a Number, not an object
          status: true // status is Boolean, not string
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: 'password123',
          total_investment: 6000,
          wallet: 200,
          status: true
        },
        {
          username: 'bob_wilson',
          email: 'bob@example.com',
          password: 'password123',
          total_investment: 800,
          wallet: 50,
          status: true
        }
      ];

      users = await User.insertMany(sampleUsers);
      console.log(`✅ Created ${users.length} sample users`);
    } else {
      console.log(`✅ Found ${users.length} existing users`);
    }

    // Create sample rewards if they don't exist
    const existingRewards = await Reward.find();
    
    if (existingRewards.length === 0) {
      console.log('Creating sample rewards...');
      const sampleRewards = [
        {
          user_id: users[0]._id,
          reward_type: 'goa_tour',
          reward_name: 'Goa Tour',
          self_invest_target: 1000,
          self_invest_achieved: 1200,
          direct_business_target: 1500,
          direct_business_achieved: 1800,
          qualification_date: new Date(),
          status: 'qualified',
          reward_value: 'Goa Tour Package'
        },
        {
          user_id: users[1]._id,
          reward_type: 'bangkok_tour',
          reward_name: 'Bangkok Tour',
          self_invest_target: 5000,
          self_invest_achieved: 5500,
          direct_business_target: 10000,
          direct_business_achieved: 12000,
          qualification_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: 'approved',
          reward_value: 'Bangkok Tour Package'
        },
        {
          user_id: users[2]._id,
          reward_type: 'goa_tour',
          reward_name: 'Goa Tour',
          self_invest_target: 1000,
          self_invest_achieved: 800,
          direct_business_target: 1500,
          direct_business_achieved: 1600,
          qualification_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'qualified',
          reward_value: 'Goa Tour Package'
        },
        {
          user_id: users[0]._id,
          reward_type: 'bangkok_tour',
          reward_name: 'Bangkok Tour',
          self_invest_target: 5000,
          self_invest_achieved: 3000,
          direct_business_target: 10000,
          direct_business_achieved: 8000,
          qualification_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'processed',
          reward_value: 'Bangkok Tour Package'
        }
      ];

      const createdRewards = await Reward.insertMany(sampleRewards);
      console.log(`✅ Created ${createdRewards.length} sample rewards`);
    } else {
      console.log(`✅ Found ${existingRewards.length} existing rewards`);
    }

    // Display summary
    const totalUsers = await User.countDocuments();
    const totalRewards = await Reward.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Rewards: ${totalRewards}`);
    
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

    console.log('\n✅ Sample data creation completed!');
    console.log('You can now test the admin reward tracking system.');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createSampleData();
  await mongoose.disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
