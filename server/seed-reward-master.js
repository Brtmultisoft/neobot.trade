const mongoose = require('mongoose');
const RewardMaster = require('./src/models/reward.master.model');

const data = [
  {
    reward_type: 'goa_tour',
    reward_name: 'Goa Tour',
    self_invest_target: 1000,
    direct_business_target: 1500,
    reward_value: 'Goa Tour Package'
  },
  {
    reward_type: 'bangkok_tour',
    reward_name: 'Bangkok Tour',
    self_invest_target: 2500,
    direct_business_target: 5000,
    reward_value: 'Bangkok Tour Package'
  },
  {
    reward_type: 'coupon_code',
    reward_name: 'Coupon Code',
    self_invest_target: 500,
    direct_business_target: 800,
    reward_value: 'Discount Coupon'
  },
  {
    reward_type: 'car_reward',
    reward_name: 'Car',
    self_invest_target: 10000,
    direct_business_target: 5000,
    reward_value: 'Monthly Car Business'
  },
  {
    reward_type: 'bike_reward',
    reward_name: 'Book Your Bike',
    self_invest_target: 7000,
    direct_business_target: 4000,
    reward_value: 'Bike Booking Reward'
  }
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/neobot';
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  for (const item of data) {
    const exists = await RewardMaster.findOne({ reward_type: item.reward_type });
    if (!exists) {
      await RewardMaster.create(item);
      console.log('Inserted:', item.reward_type);
    } else {
      console.log('Already exists:', item.reward_type);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Error seeding RewardMaster:', err);
  process.exit(1);
}); 