const mongoose = require('mongoose');
const { userModel, incomeModel } = require('../src/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mlm_db';

async function recalculateAndFixUserIncomeTotals() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const users = await userModel.find({});
  console.log(`Found ${users.length} users`);

  let updatedCount = 0;

  for (const user of users) {
    // Sum all-time direct income
    const directIncomeAgg = await incomeModel.aggregate([
      { $match: { user_id: user._id, type: 'referral_bonus', status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const directIncome = directIncomeAgg[0]?.total || 0;

    // Sum all-time daily ROI
    const dailyIncomeAgg = await incomeModel.aggregate([
      { $match: { user_id: user._id, type: 'daily_profit', status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const dailyIncome = dailyIncomeAgg[0]?.total || 0;

    // Sum all-time level ROI
    const levelIncomeAgg = await incomeModel.aggregate([
      { $match: { user_id: user._id, type: { $in: ['team_commission', 'level_roi_income'] }, status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const levelIncome = levelIncomeAgg[0]?.total || 0;

    // Print debug info
    console.log(`User: ${user.username || user.email || user._id}`);
    console.log(`  Direct Income: ${directIncome}`);
    console.log(`  Daily ROI: ${dailyIncome}`);
    console.log(`  Level ROI: ${levelIncome}`);

    // Ensure extra is initialized
    const extra = user.extra || {};
    extra.directIncome = directIncome;
    extra.dailyIncome = dailyIncome;
    extra.levelIncome = levelIncome;

    // Update the user's extra fields
    const updateResult = await userModel.updateOne(
      { _id: user._id },
      { $set: { extra } }
    );
    console.log(`  Update result:`, updateResult);
    updatedCount++;
    if (updatedCount % 100 === 0) {
      console.log(`Updated ${updatedCount} users...`);
    }
  }

  console.log(`Finished updating ${updatedCount} users.`);
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

recalculateAndFixUserIncomeTotals().catch(err => {
  console.error('Error updating user income totals:', err);
  process.exit(1);
}); 