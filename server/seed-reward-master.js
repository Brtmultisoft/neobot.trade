const mongoose = require('mongoose');
const RewardMaster = require('./src/models/reward.master.model');

const data = [
  {
    reward_name: "Goa Tour",
    reward_value: "Goa Tour",
    self_invest_target: 1000,
    direct_business_target: 1500,
    description: "",
    active: true,
    extra: {}
  },
  {
    reward_name: "Bangkok Tour",
    reward_value: "Bangkok Tour",
    self_invest_target: 2500,
    direct_business_target: 5000,
    description: "",
    active: true,
    extra: {}
  },
  {
    reward_name: "Coupon Code",
    reward_value: "Coupon worth $500",
    self_invest_target: 500,
    direct_business_target: 800,
    description: "",
    active: true,
    extra: {}
  },
  {
    reward_name: "Car",
    reward_value: "Car",
    self_invest_target: 10000,
    direct_business_target: 5000,
    description: "Monthly Business every month",
    active: true,
    extra: {
      note: "Monthly Business every month"
    }
  },
  {
    reward_name: "Book Your Bike",
    reward_value: "Bike",
    self_invest_target: 7000,
    direct_business_target: 4000,
    description: "",
    active: true,
    extra: {}
  }
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/neobot';
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  for (const item of data) {
    const exists = await RewardMaster.findOne({ reward_name: item.reward_name });
    if (!exists) {
      await RewardMaster.create(item);
      console.log('Inserted:', item.reward_name);
    } else {
      console.log('Already exists:', item.reward_name);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Error seeding RewardMaster:', err);
  process.exit(1);
}); 