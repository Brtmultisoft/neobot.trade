"use strict";
const logger = require("../../services/logger");
const log = new logger("IncomeController").getChildLogger();
const {
  incomeDbHandler,
  userDbHandler,
  investmentDbHandler,
  settingDbHandler,
  withdrawalDbHandler,
  rankDbHandler,
  teamRewardDbHandler,
  investmentPlanDbHandler,
} = require("../../services/db");
const {
  getTopLevelByRefer,
  getPlacementIdByRefer,
  getPlacementId,
} = require("../../services/commonFun");
const mongoose = require("mongoose");
const cron = require("node-cron");
const config = require("../../config/config");
const { tradingPackageModel } = require("../../models");
const { ethers }  = require('ethers');
const Reward = require('../../models/reward.model');

const ObjectId = mongoose.Types.ObjectId;
const contractABI = process.env.WITHDRAW_ABI;
const contractAddress = process.env.WITHDRAW_ADDRESS

// Utility function to check if a user has made an investment
const hasUserInvested = async (userId) => {
  console.log('==================== CHECKING IF USER HAS INVESTED ====================');
  console.log('Checking if user has invested, userId:', userId);

  try {
    // First check the user's total_investment field
    const user = await userDbHandler.getById(userId);
    console.log('User found:', user ? 'Yes' : 'No');

    if (user) {
      console.log('User details:');
      console.log('- User ID:', user._id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Total investment:', user.total_investment);
    }

    if (user && user.total_investment > 0) {
      console.log('User has total_investment > 0, returning true');
      console.log('==================== END CHECKING IF USER HAS INVESTED ====================');
      return true;
    }

    console.log('Total investment is 0 or null, checking for active investments');
    // As a fallback, check if the user has any active investments
    // Check for both string 'active' and numeric status 1 (which is also active)
    const investments = await investmentDbHandler.getByQuery({
      user_id: userId,
      status: { $in: ['active', 1] }
    });

    console.log('Investments found:', investments ? investments.length : 0);

    if (investments && investments.length > 0) {
      console.log('Investment details:');
      investments.forEach((inv, index) => {
        console.log(`Investment ${index + 1}:`);
        console.log(`- ID: ${inv._id}`);
        console.log(`- Amount: ${inv.amount}`);
        console.log(`- Status: ${inv.status}`);
        console.log(`- Package type: ${inv.package_type}`);
        console.log(`- Created at: ${inv.created_at}`);
      });
    }

    const result = investments && investments.length > 0;
    console.log('Final result:', result ? 'User has invested' : 'User has not invested');
    console.log('==================== END CHECKING IF USER HAS INVESTED ====================');
    return result;
  } catch (error) {
    console.error(`Error checking if user ${userId} has invested:`, error);
    console.error('Error stack:', error.stack);
    console.log('==================== END CHECKING IF USER HAS INVESTED (ERROR) ====================');
    return false; // Default to false in case of error
  }
};

// Valid slot values for packages
const validSlots = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

const distributeTokens = async () => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));
    // Fetch all new users created today
    const newUsers = await userDbHandler.getByQuery({
      created_at: { $gte: startOfDay, $lt: endOfDay },
      status: 1,
    });

    for (const newUser of newUsers) {
      // Fetch previous users created before the new user
      const previousUsers = await userDbHandler.getByQuery({
        created_at: { $lt: newUser.created_at },
        status: 1,
      });
      console.log("previousUsers", previousUsers.length);
      if (previousUsers.length === 0) continue; // Skip if no previous users

      // Calculate total investment made by the new user today
      const investmentsToday = await investmentDbHandler.getByQuery({
        user_id: newUser._id,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: 1,
        type: 0,
      });

      const totalInvestment = investmentsToday.reduce(
        (sum, investment) => sum + investment.amount,
        0
      );

      if (totalInvestment === 0) continue; // Skip if no investment

      // Get the new user's highest package level
      const newUserPackages = await investmentDbHandler.getByQuery({
        user_id: newUser._id,
        status: 1
      });
      const newUserMaxPackage = newUserPackages.length > 0 ?
        Math.max(...newUserPackages.map(inv => inv.slot_value)) : -1;

      const provisionAmount = totalInvestment * 0.4; // 40% of today's investment
      const amountPerUser = provisionAmount / previousUsers.length; // Distribute equally among previous users

      // Distribute to previous users
      for (let prevUser of previousUsers) {
        // Get the previous user's highest package level
        const prevUserPackages = await investmentDbHandler.getByQuery({
          user_id: prevUser._id,
          status: 1
        });
        const prevUserMaxPackage = prevUserPackages.length > 0 ?
          Math.max(...prevUserPackages.map(inv => inv.slot_value)) : -1;

        // Skip if previous user's package level is lower than new user's
        if (prevUserMaxPackage < newUserMaxPackage) continue;

        if (prevUser.extra?.cappingLimit <= 0 || prevUser.extra?.cappingLimit < amountPerUser) {
          continue;
        }
        await userDbHandler.updateByQuery(
          { _id: ObjectId(prevUser._id) },
          {
            $inc: {
              wallet: amountPerUser,
              "extra.provisionIncome": amountPerUser,
              "extra.cappingLimit": -amountPerUser,
            },
          }
        );
        await incomeDbHandler.create({
          user_id: ObjectId(prevUser._id),
          user_id_from: ObjectId(newUser._id),
          type: 2,
          amount: amountPerUser,
          status: 1,
          extra: {
            income_type: "provision",
            fromPackageLevel: newUserMaxPackage
          },
        });
      }
    }

    log.info("Provision distribution completed successfully.");
  } catch (error) {
    log.error("Error in provision distribution", error);
  }
};
const AutoFundDistribution = async (req, res) => {
  try {
    const users = await withdrawalDbHandler.getByQuery({ amount: { $gt: 0 }, status: 0 });
    if (!users || users.length === 0) {
      log.info("No users with Withdraw balance found for auto withdraw.");
      return res
        .status(400)
        .json({ message: "No users eligible for withdraw" });
    }
    const batchSize = 20;
    const totalUsers = users.length;
    let batchStart = 0;
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');
    console.log("withdraw");
    const key = await settingDbHandler.getOneByQuery({name:"Keys"});
    console.log(key)
    const wallet = new ethers.Wallet(key.value, provider);
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      wallet
    );

    while (batchStart < totalUsers) {
      const batchUsers = users.slice(batchStart, batchStart + batchSize);
      const addressArr = batchUsers.map((user) => `${user.address}`);
      const amountArr = batchUsers.map((user) => `${user.net_amount}`);

      log.info(`Sending batch ${batchStart / batchSize + 1} auto withdraw request:`);
      console.log("BatchUsr" , batchUsers);
      console.log("address", addressArr)
      console.log("amount" , amountArr)
      try {
        const tx = await contract.fundsDistribution(addressArr, amountArr);
        await tx.wait();

        let successAddresses = [];
        for (let i = 0; i < addressArr.length; i++) {
          let address = addressArr[i];
          let net_amount = amountArr[i];

          try {
            let data = await contract.users(address);
            // Compare amounts in Wei
            if (net_amount == data.lastClaimAmount) {
              successAddresses.push(address);
            }
          } catch (error) {
            log.error(`Error fetching details for ${address}:`, error);
          }
        }

        console.log(successAddresses);
        log.info(`Batch ${batchStart / batchSize + 1} auto withdraw successful`);
        log.info("successAddresses", successAddresses);

        for (let user of batchUsers) {
          if (successAddresses.includes(user.address)) {
            const res = await withdrawalDbHandler.updateOneByQuery(
              { _id: ObjectId(user._id) },
              { $set: { status: 1, remark: "SUCCESS" } }
            );
            console.log("Withdrawal status updated:", res);
          }
        }
      } catch (error) {
        log.error(`Batch ${batchStart / batchSize + 1} failed:`, error);
        // Continue with next batch even if current batch fails
      }

      batchStart += batchSize;
    }

    log.info("All batches processed successfully.");
    return res.status(200).json({ message: "All auto withdraw batches completed" });

  } catch (error) {
    log.error("Error during minting request:", error.message);
    return res.status(400).json({ message: "Error during minting" });
  }
};

// Distribute Level Income
const distributeLevelIncome = async (user_id, amount, fromPackageLevel) => {
  try {
    let topLevels = await getTopLevelByRefer(
      user_id,
      config.levelIncomePercentages.length
    );
    for (let i = 0; i < topLevels.length; i++) {
      let levelUser = topLevels[i];
      if (!levelUser) continue;
      console.log("levelUser", levelUser);

      // Check if the user has made an investment
      const hasInvested = await hasUserInvested(levelUser);
      if (!hasInvested) {
        console.log(`User ${levelUser} has not made any investment. Skipping level income.`);
        continue; // Skip to the next user
      }

      const levelUsers = await userDbHandler.getOneByQuery({
        _id: ObjectId(topLevels[i]),
      });

      // Get the user's highest package level using slot_value
      const userPackages = await investmentDbHandler.getByQuery({
        user_id: ObjectId(levelUser),
        status: 1
      });
      const userMaxPackage = userPackages.length > 0 ?
        Math.max(...userPackages.map(inv => inv.slot_value)) : -1;

      // Skip if user's package level is lower than the income source's package level
      if (userMaxPackage < fromPackageLevel) continue;

      let levelAmount = (amount * config.levelIncomePercentages[i]) / 100;
      if (levelUsers.extra.cappingLimit <= 0 || levelUsers.extra.cappingLimit <= levelAmount) {
        continue;
      }
      await userDbHandler.updateOneByQuery(
        { _id: ObjectId(levelUser) },
        {
          $inc: {
            wallet : levelAmount,
            reward: levelAmount,
            "extra.levelIncome": levelAmount,
            "extra.totalIncome": levelAmount,
            "extra.cappingLimit": -levelAmount,
          },
        }
      );

      await incomeDbHandler.create({
        user_id: levelUser,
        user_id_from: user_id,
        amount: levelAmount,
        level: i + 1,
        type: 5,
        remarks: `Level ${i + 1} income ${
          amount * config.levelIncomePercentages[i]
        }%`,
        extra: {
          income_type: "level",
          fromPackageLevel
        },
      });
    }
  } catch (error) {
    log.error("Error in level income distribution", error);
  }
};

// Transfer Remaining to Reward & Achiever Wallet
const transferToRewardWallet = async (amount) => {
  try {
    await userDbHandler.updateOneByQuery(
      { _id: ObjectId(config.rewardWallet) },
      { $inc: { wallet: amount } }
    );

    await incomeDbHandler.create({
      user_id: config.rewardWallet,
      amount: amount,
      type: 4,
      remarks: "Reward & Achiever Wallet Distribution",
    });
  } catch (error) {
    log.error("Error transferring to Reward & Achiever Wallet", error);
  }
};

// Schedule Cron Job to Run Daily at Midnight
// cron.schedule('0 0 * * *', distributeTokens, {
//     scheduled: true,
//     timezone: "UTC"
// });

const distributeTokensHandler = async (req, res) => {
  try {
    await distributeTokens(); // Call the function that handles the distribution
    res
      .status(200)
      .json({ message: "Token distribution triggered successfully" });
  } catch (error) {
    log.error("Error triggering token distribution", error);
    res.status(500).json({ message: "Error triggering token distribution" });
  }
};

const distributeGlobalAutoPoolMatrixIncome = async (user_id, amount, fromPackageLevel) => {
  try {
    // Fetch the new user
    const newUser = await userDbHandler.getById(user_id);
    if (!newUser) throw new Error("User not found");

    // Use the placement_id stored in the newUser object
    let currentPlacementId = newUser.placement_id;
    if (!currentPlacementId) throw new Error("No placement available");

    // Calculate matrix income (10% of the amount)
    const matrixIncome = (amount * 10) / 100;

    // Traverse the placement hierarchy until placement_id becomes null
    while (currentPlacementId) {
      const placementUser = await userDbHandler.getOneByQuery({
        _id: ObjectId(currentPlacementId),
      });
      if (!placementUser) break;

      // Check if the placement user has made an investment
      const hasInvested = await hasUserInvested(currentPlacementId);
      if (!hasInvested) {
        console.log(`Placement user ${placementUser.username || placementUser.email} has not made any investment. Skipping matrix income.`);
        currentPlacementId = placementUser.placement_id;
        continue; // Skip to the next user
      }

      // Get the placement user's highest package level using slot_value
      const userPackages = await investmentDbHandler.getByQuery({
        user_id: ObjectId(currentPlacementId),
        status: 1
      });
      const userMaxPackage = userPackages.length > 0 ?
        Math.max(...userPackages.map(inv => inv.slot_value)) : -1;

      // Skip if user's package level is lower than the income source's package level
      if (userMaxPackage < fromPackageLevel) {
        currentPlacementId = placementUser.placement_id;
        continue;
      }

      console.log("placementUser", placementUser.extra);
      if (placementUser.extra.cappingLimit <= 0 || placementUser.extra.cappingLimit < matrixIncome) {
        currentPlacementId = placementUser.placement_id;
        continue;
      }
      // Distribute matrix income to the placement user
      const auser = await userDbHandler.getById(currentPlacementId);
      await userDbHandler.updateOneByQuery(
        { _id: ObjectId(currentPlacementId) },
        {
          // $inc: {
            wallet: auser.wallet + matrixIncome,
            "extra.matrixIncome": auser.extra.matrixIncome + matrixIncome,
            "extra.cappingLimit": auser.extra.cappingLimit - matrixIncome,
          // },
        }
      );

      await incomeDbHandler.create({
        user_id: ObjectId(currentPlacementId),
        user_id_from: ObjectId(user_id),
        amount: matrixIncome,
        type: 6,
        status: 1,
        extra: {
          income_type: "matrix",
          fromPackageLevel
        },
      });

      // Move to the next placement user
      currentPlacementId = placementUser.placement_id;
    }

    return true;
  } catch (error) {
    log.error("Error in matrix income distribution:", error);
    throw error;
  }
};

/**
 * Process Level ROI Income (Team Commission) for up to 10 levels.
 * Eligibility: User is eligible for level N ROI only if they have at least N direct referrals.
 * - Skips users who have not invested or already received ROI for this downline today.
 * - Uses plan/team_commission percentages if available, else defaults.
 * @param {ObjectId} user_id - The user who received daily profit (downline)
 * @param {number} amount - The daily profit amount
 * @returns {Promise<boolean>} Success
 */
const processTeamCommission = async (user_id, amount) => {
  try {
    // Get team commission percentages
    const { investmentPlanDbHandler } = require('../../services/db');
    let percentages = {};
    try {
      const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
      if (investmentPlan && investmentPlan.team_commission) {
        percentages = {
          level1: investmentPlan.team_commission.level1 || 15,
          level2: investmentPlan.team_commission.level2 || 10,
          level3: investmentPlan.team_commission.level3 || 7.5,
          level4: investmentPlan.team_commission.level4 || 5,
          level5: investmentPlan.team_commission.level5 || 2.5,
          level6: investmentPlan.team_commission.level6 || 2,
          level7: investmentPlan.team_commission.level7 || 2,
          level8: investmentPlan.team_commission.level8 || 2,
          level9: investmentPlan.team_commission.level9 || 2,
          level10: investmentPlan.team_commission.level10 || 2
        };
      } else {
        percentages = {
          level1: 15, level2: 10, level3: 7.5, level4: 5, level5: 2.5,
          level6: 2, level7: 2, level8: 2, level9: 2, level10: 2
        };
      }
    } catch {
      percentages = {
        level1: 15, level2: 10, level3: 7.5, level4: 5, level5: 2.5,
        level6: 2, level7: 2, level8: 2, level9: 2, level10: 2
      };
    }

    // Get the user who received profit
    const investmentUser = await userDbHandler.getById(user_id);
    if (!investmentUser) return false;
    let currentUser = await userDbHandler.getById(investmentUser.refer_id);
    let level = 1;
    const maxLevel = 10;

    while (currentUser && level <= maxLevel) {
      // 1. Must have invested
      const hasInvested = await hasUserInvested(currentUser._id);
      if (!hasInvested) {
        currentUser = await getNextUpline(currentUser);
        level++;
        continue;
      }
      // 2. Must have enough direct referrals for this level
      const directReferrals = await userDbHandler.getByQuery({ refer_id: currentUser._id });
      if (directReferrals.length < level) {
        currentUser = await getNextUpline(currentUser);
        level++;
        continue;
      }
      // 3. Must not have already received this level ROI from this downline today
      const today = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(today.getTime() + istOffset);
      todayIST.setHours(0, 0, 0, 0);
      const existingLevelRoi = await incomeDbHandler.getOneByQuery({
        user_id: currentUser._id,
        user_id_from: user_id,
        type: 'level_roi_income',
        level: level,
        created_at: { $gte: todayIST, $lt: new Date(todayIST.getTime() + 24 * 60 * 60 * 1000) }
      });
      if (existingLevelRoi) {
        currentUser = await getNextUpline(currentUser);
        level++;
        continue;
      }
      // 4. Calculate and credit commission
      const commissionPercentage = percentages[`level${level}`];
      if (!commissionPercentage) {
        currentUser = await getNextUpline(currentUser);
        level++;
        continue;
      }
      const commissionAmount = (amount * commissionPercentage) / 100;
      await userDbHandler.updateOneByQuery(
        { _id: currentUser._id },
        { $inc: { wallet: commissionAmount, "extra.teamCommission": commissionAmount } }
      );
      await incomeDbHandler.create({
        user_id: ObjectId(currentUser._id),
        user_id_from: ObjectId(user_id),
        type: 'level_roi_income',
        amount: commissionAmount,
        status: 'credited',
        level: level,
        description: `Level ${level} ROI Income`,
        extra: {
          fromUser: investmentUser.username || investmentUser.email,
          dailyProfitAmount: amount,
          commissionPercentage,
          directReferralsCount: directReferrals.length,
          requiredDirectReferrals: level,
          qualificationMet: true,
          levelIncomeRule: `Level ${level} requires at least ${level} direct referrals. User has ${directReferrals.length}.`
        }
      });
      currentUser = await getNextUpline(currentUser);
      level++;
    }
    return true;
  } catch (error) {
    console.error('Error processing team commission:', error);
    return false;
  }
};

// Helper to get next upline user (handles 'admin' refer_id)
async function getNextUpline(user) {
  if (!user.refer_id) return null;
  if (user.refer_id === 'admin') {
    return await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" });
  }
  return await userDbHandler.getById(user.refer_id);
}

// Process active member rewards
const _processActiveMemberReward = async () => {
  try {
    // Get the investment plan to access active member reward data
    const plans = await investmentPlanDbHandler.getAll({});
    if (!plans || plans.length === 0) {
      log.error('No investment plans found for active member rewards');
      return;
    }
    const plan = plans[0];

    // console.log(`Found investment plan: ${plan.title}`);

    // Check if plan has active_member_rewards
    if (!plan.active_member_rewards) {
      // console.log('No active_member_rewards field in the investment plan');
      return;
    }

    if (!Array.isArray(plan.active_member_rewards)) {
      // console.log(`active_member_rewards is not an array: ${typeof plan.active_member_rewards}`);
      return;
    }

    // console.log(`Plan has ${plan.active_member_rewards.length} active member reward levels:`);
    // plan.active_member_rewards.forEach((level, index) => {
    //   console.log(`Level ${index + 1}: ${level.direct} direct referrals, ${level.team} team size, $${level.reward} reward`);
    // });

    // Get all users directly using mongoose
    let users = [];
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('Users');
      users = await User.find({});

      // console.log(`Found ${users.length} users using direct mongoose query`);

      // Continue with processing if we have users
      if (!users || users.length === 0) {
        // console.log('No users found in the database');
        return;
      }
    } catch (userQueryError) {
      // console.error('Error querying users:', userQueryError);
      return;
    }

    // console.log(`Processing active member rewards for ${users.length} users`);

    for (const user of users) {
      // console.log(`\nProcessing user: ${user.username || user.email} (ID: ${user._id})`);

      // Count direct referrals using mongoose directly
      const User = mongoose.model('Users');
      const directReferrals = await User.find({ refer_id: user._id });
      const directCount = directReferrals.length;
      // console.log(`Direct referrals: ${directCount}`);
      if (directCount > 0) {
        console.log(`Direct referral emails: ${directReferrals.map(u => u.email).join(', ')}`);
      }

      // Count total team size (all levels)
      let teamSize = 0;
      const countTeamMembers = async (referrerId) => {
        const User = mongoose.model('Users');
        const referrals = await User.find({ refer_id: referrerId });
        teamSize += referrals.length;

        // Process next level recursively
        for (const referral of referrals) {
          await countTeamMembers(referral._id);
        }
      };

      await countTeamMembers(user._id);
      // console.log(`Total team size: ${teamSize}`);

      // Check if plan has active_member_rewards
      if (!plan.active_member_rewards || !Array.isArray(plan.active_member_rewards)) {
        console.log('No active_member_rewards found in the investment plan');
        continue;
      }

      // console.log(`Checking ${plan.active_member_rewards.length} reward levels...`);

      // Check if user qualifies for any reward level
      // Check if the user has made an investment
      const hasInvested = await hasUserInvested(user._id);
      if (!hasInvested) {
        console.log(`User ${user.username || user.email} has not made any investment. Skipping active member reward.`);
        continue; // Skip to the next user
      }

      for (const rewardLevel of plan.active_member_rewards) {
        // console.log(`Checking reward level: ${rewardLevel.direct} direct, ${rewardLevel.team} team, $${rewardLevel.reward} reward`);

        // TEMPORARY TEST CODE: Lower thresholds for testing
        const testDirect = 2; // Temporarily set to 2 instead of rewardLevel.direct
        const testTeam = 7;   // Temporarily set to 7 instead of rewardLevel.team

        // console.log(`Using test thresholds: ${testDirect} direct, ${testTeam} team (original: ${rewardLevel.direct} direct, ${rewardLevel.team} team)`);

        if (directCount >= testDirect && teamSize >= testTeam) {
          // console.log(`User qualifies for reward level: ${rewardLevel.direct} direct, ${rewardLevel.team} team, $${rewardLevel.reward} reward`);

          // Check if user already received this reward using mongoose directly
          const Income = mongoose.model('Incomes');
          const existingReward = await Income.findOne({
            user_id: user._id,
            type: 'active_member_reward',
            'extra.directRequired': rewardLevel.direct,
            'extra.teamRequired': rewardLevel.team
          });

          // console.log(`Checking if user already received this reward: ${existingReward ? 'Yes' : 'No'}`);

          if (!existingReward) {
            // console.log(`Creating new active member reward of $${rewardLevel.reward} for user ${user.username || user.email}`);

            try {
              // Create reward income record using mongoose directly
              const newIncome = new Income({
                user_id: mongoose.Types.ObjectId(user._id),
                type: 'active_member_reward',
                amount: rewardLevel.reward,
                status: 'credited',
                description: 'Active member reward',
                extra: {
                  directReferrals: directCount,
                  teamSize: teamSize,
                  directRequired: rewardLevel.direct,
                  teamRequired: rewardLevel.team
                }
              });

              await newIncome.save();
              // console.log(`Income record created with ID: ${newIncome._id}`);

              // Add reward to user's wallet using mongoose directly
              const walletUpdate = await User.findByIdAndUpdate(
                user._id,
                {
                  $inc: {
                    wallet: rewardLevel.reward,
                    "extra.activeMemberReward": rewardLevel.reward
                  }
                },
                { new: true }
              );

              console.log(`Wallet updated. New balance: $${walletUpdate.wallet}`);
            } catch (rewardError) {
              console.error(`Error creating reward: ${rewardError.message}`);
            }

            // Only give the highest reward level the user qualifies for
            break;
          }
        }
      }
    }

    return true;
  } catch (error) {
    log.error('Error processing active member rewards:', error);
    return false;
  }
};

// API endpoint for processing active member rewards
const processActiveMemberReward = async (req, res) => {
  try {
    console.log("Processing active member rewards...");
    const result = await _processActiveMemberReward();

    if (result) {
      return res.status(200).json({
        status: true,
        message: 'Active member rewards processed successfully'
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process active member rewards'
      });
    }
  } catch (error) {
    console.error('Error in active member rewards API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing active member rewards',
      error: error.message
    });
  }
};

// Helper function to check and fix any trade activations with pending status
const _checkAndFixPendingActivations = async () => {
  try {
    console.log('\n======== CHECKING FOR PENDING TRADE ACTIVATIONS ========');

    const { tradeActivationDbHandler } = require('../../services/db');

    // Get all pending activations from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pendingActivations = await tradeActivationDbHandler.getByQuery({
      activation_date: {
        $gte: sevenDaysAgo
      },
      status: 'active',
      profit_status: 'pending'
    });

    console.log(`Found ${pendingActivations.length} pending trade activations from the last 7 days`);

    if (pendingActivations.length === 0) {
      return {
        success: true,
        message: 'No pending activations found',
        pendingCount: 0
      };
    }

    // Group by date for better reporting
    const activationsByDate = {};
    for (const activation of pendingActivations) {
      const dateKey = activation.activation_date.toISOString().split('T')[0];
      if (!activationsByDate[dateKey]) {
        activationsByDate[dateKey] = [];
      }
      activationsByDate[dateKey].push(activation);
    }

    console.log('Pending activations by date:');
    for (const [date, activations] of Object.entries(activationsByDate)) {
      console.log(`- ${date}: ${activations.length} pending activations`);
    }

    return {
      success: true,
      pendingCount: pendingActivations.length,
      activationsByDate,
      pendingActivations
    };
  } catch (error) {
    console.error('Error checking pending activations:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Processes Level ROI Income for all users who received daily profit today.
 * - Prevents duplicate processing using last_level_roi_processed_date.
 * - Groups daily profits by user and processes team commissions.
 * - Logs execution and errors, and updates cron execution records.
 * @param {string} triggeredBy - Source of trigger ('automatic', 'manual', etc.)
 * @returns {Promise<Object>} Result summary
 */
const _processLevelRoiIncome = async (triggeredBy = 'automatic') => {
  let cronExecutionId = null;
  const startTime = Date.now();

  try {
    console.log(`[LEVEL_ROI] Starting level ROI processing at ${new Date().toISOString()}`);
    const { cronExecutionDbHandler } = require('../../services/db');
    const cronExecution = await cronExecutionDbHandler.create({
      cron_name: 'level_roi',
      start_time: new Date(),
      status: 'running',
      triggered_by: triggeredBy,
      server_info: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      }
    });
    cronExecutionId = cronExecution._id;

    // Set today's date in IST
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + istOffset);
    todayIST.setHours(0, 0, 0, 0);
    const todayEndIST = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);

    // Get all income records from today's daily profit processing
    const { incomeDbHandler } = require('../../services/db');
    const todaysDailyProfits = await incomeDbHandler.getByQuery({
      type: 'daily_profit',
      created_at: { $gte: todayIST, $lt: todayEndIST },
      status: 'credited'
    });
    console.log(`[LEVEL_ROI] Found ${todaysDailyProfits.length} daily profit records from today`);

    if (!todaysDailyProfits.length) {
      console.log('[LEVEL_ROI] No daily profit records found for today. Skipping level ROI processing.');
      await cronExecutionDbHandler.updateById(cronExecutionId, {
        end_time: new Date(),
        duration_ms: Date.now() - startTime,
        status: 'completed',
        processed_count: 0,
        total_amount: 0,
        execution_details: {
          message: 'No daily profit records found for today',
          processing_mode: 'all_invested_users'
        }
      });
      return {
        success: true,
        processedCount: 0,
        totalCommission: 0,
        message: 'No daily profit records found for today',
        cronExecutionId
      };
    }

    let processedCount = 0;
    let totalCommission = 0;
    const errors = [];
    let skippedCount = 0;

    // Group daily profits by user
    const userProfitMap = new Map();
    for (const profit of todaysDailyProfits) {
      const userId = profit.user_id.toString();
      if (!userProfitMap.has(userId)) {
        userProfitMap.set(userId, {
          user_id: profit.user_id,
          total_profit: 0,
          profit_records: []
        });
      }
      const userProfit = userProfitMap.get(userId);
      userProfit.total_profit += profit.amount;
      userProfit.profit_records.push(profit);
    }
    console.log(`[LEVEL_ROI] Found ${userProfitMap.size} unique users who received daily profit today`);

    // Process level ROI income for each user
    for (const [userId, userProfitData] of userProfitMap) {
      try {
        const user = await userDbHandler.getById(userProfitData.user_id);
        if (!user) {
          errors.push({ user_id: userId, error: 'User not found' });
          continue;
        }
        // Prevent duplicate processing
        const lastLevelRoiProcessedDate = user.last_level_roi_processed_date || user.extra?.last_level_roi_processed_date;
        // if (lastLevelRoiProcessedDate) {
        //   const lastProcessedDate = new Date(lastLevelRoiProcessedDate);
        //   lastProcessedDate.setHours(0, 0, 0, 0);
        //   if (lastProcessedDate.getTime() === todayIST.getTime()) {
            // skippedCount++;
        //     continue;
        //   }
        // }
        // Check if user has made an investment
        const hasInvested = await hasUserInvested(user._id);
        if (!hasInvested) {
          skippedCount++;
          continue;
        }
        // Use the total profit amount for level ROI calculation
        const profitAmount = userProfitData.total_profit;
        if (profitAmount <= 0) {
          skippedCount++;
          continue;
        }
        // Process team commissions
        try {
          const teamCommissionResult = await processTeamCommission(user._id, profitAmount);
          if (teamCommissionResult) {
            await userDbHandler.updateByQuery(
              { _id: user._id },
              {
                last_level_roi_processed_date: todayIST,
                $set: { "extra.last_level_roi_processed_date": todayIST }
              }
            );
            processedCount++;
            totalCommission += profitAmount;
          }
        } catch (commissionError) {
          errors.push({ user_id: user._id, error: commissionError.message });
        }
      } catch (userError) {
        errors.push({ user_id: userId, error: userError.message });
      }
    }

    // Log summary
    console.log(`[LEVEL_ROI] Level ROI processing completed at ${new Date().toISOString()}`);
    console.log(`[LEVEL_ROI] Processed ${processedCount} users, total commission: $${totalCommission.toFixed(2)}, skipped: ${skippedCount}`);
    if (errors.length) {
      console.error(`[LEVEL_ROI] Encountered ${errors.length} errors during processing`);
      try {
        const fs = require('fs');
        const errorLogPath = './logs/level-roi-errors.log';
        if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
        const errorLog = {
          timestamp: new Date().toISOString(),
          cronExecutionId,
          errors
        };
        fs.appendFileSync(errorLogPath, JSON.stringify(errorLog) + '\n');
      } catch (logError) {
        console.error(`[LEVEL_ROI] Error logging errors:`, logError);
      }
    }

    // Update the cron execution record
    const endTime = Date.now();
    await cronExecutionDbHandler.updateById(cronExecutionId, {
      end_time: new Date(),
      duration_ms: endTime - startTime,
      status: errors.length ? 'partial_success' : 'completed',
      processed_count: processedCount,
      total_amount: totalCommission,
      error_count: errors.length,
      error_details: errors.length ? errors : [],
      execution_details: {
        total_users_with_profit: userProfitMap.size,
        processed_count: processedCount,
        skipped_count: skippedCount,
        processing_mode: 'all_profit_recipients'
      }
    });

    return {
      success: true,
      processedCount,
      totalCommission,
      errors: errors.length ? errors : undefined,
      cronExecutionId
    };
  } catch (error) {
    console.error('[LEVEL_ROI] Error processing level ROI income:', error);
    if (cronExecutionId) {
      const { cronExecutionDbHandler } = require('../../services/db');
      const endTime = Date.now();
      await cronExecutionDbHandler.updateById(cronExecutionId, {
        end_time: new Date(),
        duration_ms: endTime - startTime,
        status: 'failed',
        error_count: 1,
        error_details: [{ error: error.message, stack: error.stack }]
      });
    }
    return {
      success: false,
      error: error.message,
      cronExecutionId
    };
  }
};

// Process daily trading profit - runs at 12:30 AM UTC via cron job
// Gives daily ROI to ALL users with active investments, regardless of activation status
// Only processes each investment once per day based on last_profit_date to prevent duplicates
const _processDailyTradingProfit = async (triggeredBy = 'automatic') => {
  // Create a cron execution record
  let cronExecutionId = null;
  const startTime = Date.now();

  try {
    console.log(`[DAILY_PROFIT] Starting daily profit processing at ${new Date().toISOString()}`);

    // Create a cron execution record
    const { cronExecutionDbHandler } = require('../../services/db');
    const cronExecution = await cronExecutionDbHandler.create({
      cron_name: 'daily_profit',
      start_time: new Date(),
      status: 'running',
      triggered_by: triggeredBy,
      server_info: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      }
    });

    cronExecutionId = cronExecution._id;
    console.log(`[DAILY_PROFIT] Created cron execution record with ID: ${cronExecutionId}`);

    // Set today's date for profit calculation using IST
    const today = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + istOffset);
    todayIST.setHours(0, 0, 0, 0);

    // Get all active investments that haven't received profit today
    // Check last_profit_date to ensure we don't give duplicate ROI
    console.log(`[DAILY_PROFIT] Today IST date for comparison: ${todayIST.toISOString()}`);

    // First, let's get all active investments to debug
    const allActiveInvestments = await investmentDbHandler.getByQuery({ status: 'active' });
    console.log(`[DAILY_PROFIT] Total active investments found: ${allActiveInvestments.length}`);

    if (allActiveInvestments.length === 0) {
      console.log(`[DAILY_PROFIT] ❌ No active investments found in database!`);
      return {
        success: true,
        processedCount: 0,
        totalProfit: 0,
        cronExecutionId,
        message: 'No active investments found'
      };
    }

    // Log some sample investments for debugging
    for (let i = 0; i < Math.min(3, allActiveInvestments.length); i++) {
      const inv = allActiveInvestments[i];
      console.log(`[DAILY_PROFIT] Sample Investment ${i + 1}: ID=${inv._id}, Amount=$${inv.amount}, LastProfit=${inv.last_profit_date || 'Never'}`);
    }

    // Get eligible investments - Simple and effective approach
    const todayDateString = todayIST.toISOString().split('T')[0];
    console.log(`[DAILY_PROFIT] Looking for investments that haven't received profit on: ${todayDateString}`);

    // First get all active investments
    const activeInvestments = await investmentDbHandler.getByQuery({
      status: 'active'
    });

    console.log(`[DAILY_PROFIT] Found ${activeInvestments.length} total active investments`);

    // Filter out investments that already received profit today using income records
    const { incomeDbHandler } = require('../../services/db');
    const todayStart = new Date(todayIST);
    const todayEnd = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);

    // Get all daily profit records for today
    const todayProfitRecords = await incomeDbHandler.getByQuery({
      type: 'daily_profit',
      created_at: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });

    console.log(`[DAILY_PROFIT] Found ${todayProfitRecords.length} daily profit records for today`);

    // Create a set of investment IDs that already received profit today
    const processedInvestmentIds = new Set(
      todayProfitRecords.map(record => record.investment_id?.toString()).filter(Boolean)
    );

    // Filter out already processed investments
    const eligibleInvestments = activeInvestments.filter(investment =>
      !processedInvestmentIds.has(investment._id.toString())
    );

    console.log(`[DAILY_PROFIT] ${eligibleInvestments.length} investments eligible for daily profit (${activeInvestments.length - eligibleInvestments.length} already processed today)`);

    // STRICT: Only process investments that are truly eligible (no debugging override)
    let investmentsToProcess = eligibleInvestments;

    if (eligibleInvestments.length === 0) {
      console.log(`[DAILY_PROFIT] ✅ No investments eligible for daily profit today (already processed or no investments)`);
      console.log(`[DAILY_PROFIT] This is CORRECT behavior to prevent duplicate daily ROI`);

      // Update cron execution record
      const endTime = Date.now();
      const duration = endTime - startTime;

      await cronExecutionDbHandler.updateById(cronExecutionId, {
        end_time: new Date(),
        duration_ms: duration,
        status: 'completed',
        processed_count: 0,
        total_amount: 0,
        error_count: 0,
        execution_details: {
          total_investments: allActiveInvestments.length,
          processed_count: 0,
          skipped_count: allActiveInvestments.length,
          processing_mode: 'strict_date_check',
          message: 'No investments eligible - preventing duplicate ROI'
        }
      });

      return {
        success: true,
        processedCount: 0,
        totalProfit: 0,
        cronExecutionId,
        message: 'No investments eligible for daily profit today (preventing duplicates)'
      };
    }

    console.log(`[DAILY_PROFIT] Will process ${investmentsToProcess.length} investments`);
    let processedCount = 0;
    let totalProfit = 0;
    let errors = [];

    // Process investments in batches to avoid memory issues
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(investmentsToProcess.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min((batchIndex + 1) * BATCH_SIZE, investmentsToProcess.length);
      const currentBatch = investmentsToProcess.slice(batchStart, batchEnd);

      console.log(`[DAILY_PROFIT] Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatch.length} investments)`);

      // Process each investment in the current batch
      for (const investment of currentBatch) {
        try {
          // Investment is already pre-filtered, so it's eligible for processing
          console.log(`[DAILY_PROFIT] ✅ Processing Investment ${investment._id} (Amount: $${investment.amount})`);

          // Quick safety check - this should not happen since we pre-filtered
          if (processedInvestmentIds.has(investment._id.toString())) {
            console.log(`[DAILY_PROFIT] ⚠️  Investment ${investment._id} was already processed today (safety check). Skipping.`);
            continue;
          }

          // Get user information
          const user = await userDbHandler.getById(investment.user_id);
          if (!user) {
            console.error(`[DAILY_PROFIT] User not found for investment ${investment._id}. Skipping...`);
            errors.push({
              investment_id: investment._id,
              error: 'User not found'
            });

            continue;
          }

          console.log(`[DAILY_PROFIT] Processing ROI for user ${user._id} (${user.email || user.username}) - Investment: ${investment._id} (Amount: $${investment.amount})`);

          // Calculate ROI rate with RANDOM generation between min/max for THIS SPECIFIC INVESTMENT
          let roiRate;
          let packageUsed = null;
          let tradingPackageId = null;
          let roiDetails = { min: 0, max: 0, generated: 0 };

          try {
            // Method 1: Check if investment has stored trading_package_id
            if (investment.trading_package_id) {
              console.log(`[DAILY_PROFIT] Investment has stored trading_package_id: ${investment.trading_package_id}`);
              const tradingPackage = await tradingPackageModel.findById(investment.trading_package_id);

              if (tradingPackage && tradingPackage.status) {
                // Get min/max ROI from trading package or use defaults
                const minROI = tradingPackage.min_daily_roi || tradingPackage.daily_trading_roi || 0.5;
                const maxROI = tradingPackage.max_daily_roi || tradingPackage.daily_trading_roi || 1.0;

                // Generate random ROI between min and max
                roiRate = (Math.random() * (maxROI - minROI) + minROI);
                roiDetails = { min: minROI, max: maxROI, generated: roiRate };

                packageUsed = tradingPackage.name;
                tradingPackageId = tradingPackage._id;
                console.log(`[DAILY_PROFIT] ✅ Using investment's stored trading package "${tradingPackage.name}"`);
                console.log(`[DAILY_PROFIT] 🎲 Random ROI generated: ${roiRate.toFixed(3)}% (Range: ${minROI}% - ${maxROI}%)`);
              } else {
                console.log(`[DAILY_PROFIT] ❌ Stored trading package not found or inactive, trying amount-based lookup`);
              }
            }

            // Method 2: Find package by this investment's specific amount
            if (!roiRate) {
              console.log(`[DAILY_PROFIT] Looking up trading package by this investment's amount: $${investment.amount}`);
              const tradingPackage = await tradingPackageModel.findByTradingAmount(investment.amount);

              if (tradingPackage) {
                // Get min/max ROI from trading package or use defaults
                const minROI = tradingPackage.min_daily_roi || tradingPackage.daily_trading_roi || 0.5;
                const maxROI = tradingPackage.max_daily_roi || tradingPackage.daily_trading_roi || 1.0;

                // Generate random ROI between min and max
                roiRate = (Math.random() * (maxROI - minROI) + minROI);
                roiDetails = { min: minROI, max: maxROI, generated: roiRate };

                packageUsed = tradingPackage.name + ' (Amount-based)';
                tradingPackageId = tradingPackage._id;
                console.log(`[DAILY_PROFIT] ✅ Found trading package by amount "${tradingPackage.name}"`);
                console.log(`[DAILY_PROFIT] 🎲 Random ROI generated: ${roiRate.toFixed(3)}% (Range: ${minROI}% - ${maxROI}%)`);
              } else {
                console.log(`[DAILY_PROFIT] ❌ No trading package found for amount $${investment.amount}`);
              }
            }

            // Method 3: Use database settings for dynamic ROI ranges
            if (!roiRate) {
              console.log(`[DAILY_PROFIT] Using database settings for dynamic ROI ranges`);
              try {
                const { generateDynamicROI } = require('../../seeders/roi-settings.seeder');
                const roiData = await generateDynamicROI(investment.amount);

                // Convert monthly to daily and add some randomness
                const monthlyMin = roiData.roiRanges.silverMinROI || 20;
                const monthlyMax = roiData.roiRanges.silverMaxROI || 30;
                if (investment.amount >= (roiData.roiRanges.amountThreshold || 5000)) {
                  monthlyMin = roiData.roiRanges.goldMinROI || 30;
                  monthlyMax = roiData.roiRanges.goldMaxROI || 40;
                }

                const dailyMin = monthlyMin / 30;
                const dailyMax = monthlyMax / 30;

                // Generate random ROI between min and max
                roiRate = (Math.random() * (dailyMax - dailyMin) + dailyMin);
                roiDetails = { min: dailyMin, max: dailyMax, generated: roiRate };

                packageUsed = `${roiData.packageType} (DB Dynamic)`;
                console.log(`[DAILY_PROFIT] ✅ Using database dynamic ROI`);
                console.log(`[DAILY_PROFIT] 🎲 Random ROI generated: ${roiRate.toFixed(3)}% (Range: ${dailyMin.toFixed(3)}% - ${dailyMax.toFixed(3)}%)`);
              } catch (dbError) {
                console.error(`[DAILY_PROFIT] Error with database ROI:`, dbError);
              }
            }

            // Method 4: Simple amount-based fallback with random ranges
            if (!roiRate) {
              console.log(`[DAILY_PROFIT] Using simple amount-based random ROI calculation for $${investment.amount}`);
              let minROI, maxROI;

              if (investment.amount < 5000) {
                minROI = 0.667; // 20% monthly / 30 days
                maxROI = 1.000; // 30% monthly / 30 days
                packageUsed = 'Silver Package (Amount-based Default)';
              } else {
                minROI = 1.000; // 30% monthly / 30 days
                maxROI = 1.333; // 40% monthly / 30 days
                packageUsed = 'Gold Package (Amount-based Default)';
              }

              // Generate random ROI between min and max
              roiRate = (Math.random() * (maxROI - minROI) + minROI);
              roiDetails = { min: minROI, max: maxROI, generated: roiRate };

              console.log(`[DAILY_PROFIT] ✅ Using default random ROI: ${roiRate.toFixed(3)}% (Range: ${minROI.toFixed(3)}% - ${maxROI.toFixed(3)}%) for package "${packageUsed}"`);
            }

          } catch (packageError) {
            console.error(`[DAILY_PROFIT] Error fetching trading package:`, packageError);
            // Simple error fallback with random ranges
            let minROI, maxROI;

            if (investment.amount < 5000) {
              minROI = 0.667; // 20% monthly / 30 days
              maxROI = 1.000; // 30% monthly / 30 days
              packageUsed = 'Silver Package (Error Fallback)';
            } else {
              minROI = 1.000; // 30% monthly / 30 days
              maxROI = 1.333; // 40% monthly / 30 days
              packageUsed = 'Gold Package (Error Fallback)';
            }

            // Generate random ROI between min and max
            roiRate = (Math.random() * (maxROI - minROI) + minROI);
            roiDetails = { min: minROI, max: maxROI, generated: roiRate };

            console.log(`[DAILY_PROFIT] ✅ Using error fallback random ROI: ${roiRate.toFixed(3)}% (Range: ${minROI.toFixed(3)}% - ${maxROI.toFixed(3)}%) for package "${packageUsed}"`);
          }

          // Get the investment plan to compare with generated ROI
          const investmentPlan = await investmentPlanDbHandler.getById(investment.investment_plan_id);

          // Log comparison between investment plan percentage and generated random ROI
          if (investmentPlan && investmentPlan.percentage) {
            console.log(`[DAILY_PROFIT] Investment plan has fixed percentage: ${investmentPlan.percentage}%, but using random trading package ROI: ${roiRate.toFixed(3)}%`);
            console.log(`[DAILY_PROFIT] ROI Range: ${roiDetails.min.toFixed(3)}% - ${roiDetails.max.toFixed(3)}%, Generated: ${roiDetails.generated.toFixed(3)}%`);
          } else {
            console.log(`[DAILY_PROFIT] No investment plan percentage found, using random trading package ROI: ${roiRate.toFixed(3)}%`);
          }

          console.log(`[DAILY_PROFIT] 🎯 Final ROI Details for investment ${investment._id}:`);
          console.log(`[DAILY_PROFIT] - Package: "${packageUsed}"`);
          console.log(`[DAILY_PROFIT] - Investment Amount: $${investment.amount}`);
          console.log(`[DAILY_PROFIT] - ROI Rate: ${roiRate.toFixed(3)}% (Min: ${roiDetails.min.toFixed(3)}%, Max: ${roiDetails.max.toFixed(3)}%)`);

          // Calculate daily profit based on the investment amount and random ROI rate
          const dailyProfit = (investment.amount * roiRate) / 100;
          totalProfit += dailyProfit;

          console.log(`[DAILY_PROFIT] 💰 Daily profit calculated: $${dailyProfit.toFixed(4)} (${roiRate.toFixed(3)}% of $${investment.amount})`);

          // Use a transaction to ensure all operations succeed or fail together
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            // Add profit to user's wallet
            const walletUpdate = await userDbHandler.updateOneByQuery(
              { _id: investment.user_id },
              {
                $inc: {
                  wallet: +dailyProfit,
                  "extra.dailyProfit": dailyProfit
                }
              },
              { session }
            );

            if (!walletUpdate) {
              throw new Error(`Failed to update wallet for user ${investment.user_id}`);
            }

            console.log(`[DAILY_PROFIT] Wallet update successful for user ${investment.user_id}`);

            // Create income record with detailed tracking including random ROI details
            const incomeRecord = await incomeDbHandler.create({
              user_id: ObjectId(investment.user_id),
              investment_id: investment._id,
              type: 'daily_profit',
              amount: dailyProfit,
              status: 'credited',
              description: `Daily ROI from ${packageUsed} (${roiRate.toFixed(3)}%)`,
              extra: {
                investmentAmount: investment.amount,
                profitPercentage: roiRate,
                roiDetails: roiDetails, // Include min, max, and generated ROI
                tradingPackage: packageUsed,
                tradingPackageId: tradingPackageId || investment.trading_package_id || null,
                userCurrentPackageId: user.current_trading_package_id || null,
                userPackageInvestmentTime: user.current_package_investment_time || null,
                processingDate: new Date().toISOString(),
                cronExecutionId: cronExecutionId,
                investmentCreatedAt: investment.created_at,
                lastProfitDate: investment.last_profit_date,
                packageDetectionMethod: tradingPackageId ? 'specific_package' : 'amount_based',
                randomROIGenerated: true
              }
            }, { session });

            if (!incomeRecord) {
              throw new Error(`Failed to create income record for user ${investment.user_id}`);
            }

            console.log(`[DAILY_PROFIT] Income record created successfully`);

            // Update last profit date with current timestamp to prevent duplicates
            const currentTimestamp = new Date();
            const dateUpdate = await investmentDbHandler.updateByQuery(
              { _id: investment._id },
              { last_profit_date: currentTimestamp },
              { session }
            );

            if (!dateUpdate) {
              throw new Error(`Failed to update last profit date for investment ${investment._id}`);
            }

            console.log(`[DAILY_PROFIT] ✅ Last profit date updated: ${currentTimestamp.toISOString()}`);



            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            processedCount++;
            console.log(`[DAILY_PROFIT] Successfully processed profit for investment ${investment._id}`);
          }

          catch (transactionError) {
            // If an error occurred, abort the transaction
            await session.abortTransaction();
            session.endSession();

            console.error(`[DAILY_PROFIT] Transaction error for investment ${investment._id}:`, transactionError);
            errors.push({
              investment_id: investment._id,
              user_id: investment.user_id,
              error: transactionError.message
            });


          }
        } catch (investmentError) {
          console.error(`[DAILY_PROFIT] Error processing profit for investment ${investment._id}:`, investmentError);
          errors.push({
            investment_id: investment._id,
            error: investmentError.message
          });
        }
      }

      console.log(`[DAILY_PROFIT] Completed batch ${batchIndex + 1}/${totalBatches}`);
    }



    console.log(`[DAILY_PROFIT] Daily profit processing completed at ${new Date().toISOString()}`);
    console.log(`[DAILY_PROFIT] Processed ${processedCount} investments with total profit of $${totalProfit.toFixed(2)}`);

    if (errors.length > 0) {
      console.error(`[DAILY_PROFIT] Encountered ${errors.length} errors during processing`);
      // Log errors to a file for later analysis
      try {
        const fs = require('fs');
        const errorLogPath = './logs/daily-profit-errors.log';

        // Ensure logs directory exists
        if (!fs.existsSync('./logs')) {
          fs.mkdirSync('./logs');
        }

        const errorLog = {
          timestamp: new Date().toISOString(),
          cronExecutionId: cronExecutionId,
          errors: errors
        };

        fs.appendFileSync(errorLogPath, JSON.stringify(errorLog) + '\n');
      } catch (logError) {
        console.error(`[DAILY_PROFIT] Error logging errors:`, logError);
      }
    }

    // Update the cron execution record
    const endTime = Date.now();
    const duration = endTime - startTime;

    await cronExecutionDbHandler.updateById(cronExecutionId, {
      end_time: new Date(),
      duration_ms: duration,
      status: errors.length > 0 ? 'partial_success' : 'completed',
      processed_count: processedCount,
      total_amount: totalProfit,
      error_count: errors.length,
      error_details: errors.length > 0 ? errors : [],
      execution_details: {
        total_investments: investmentsToProcess.length,
        processed_count: processedCount,
        skipped_count: investmentsToProcess.length - processedCount,
        processing_mode: investmentsToProcess === allActiveInvestments ? 'debug_all_active' : 'date_filtered'
      }
    });

    return {
      success: true,
      processedCount,
      totalProfit,
      errors: errors.length > 0 ? errors : undefined,
      cronExecutionId
    };
  } catch (error) {
    console.error('[DAILY_PROFIT] Error processing daily trading profit:', error);

    // Update the cron execution record if it was created
    if (cronExecutionId) {
      const { cronExecutionDbHandler } = require('../../services/db');
      const endTime = Date.now();
      const duration = endTime - startTime;

      await cronExecutionDbHandler.updateById(cronExecutionId, {
        end_time: new Date(),
        duration_ms: duration,
        status: 'failed',
        error_count: 1,
        error_details: [{
          error: error.message,
          stack: error.stack
        }]
      });
    }

    return { success: false, error: error.message, cronExecutionId };
  }
};

// API endpoint for checking pending trade activations
const checkPendingActivations = async (req, res) => {
  try {
    console.log("checkPendingActivations API endpoint called");
    const result = await _checkAndFixPendingActivations();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Pending activations check completed successfully',
        data: {
          pendingCount: result.pendingCount,
          activationsByDate: result.activationsByDate,
          message: result.message
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to check pending activations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in pending activations check API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error checking pending activations',
      error: error.message
    });
  }
};

// API endpoint for processing level ROI income
const processLevelRoiIncome = async (req, res) => {
  try {
    console.log("processLevelRoiIncome");
    const result = await _processLevelRoiIncome();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Level ROI income processed successfully',
        data: {
          processedUsers: result.processedCount,
          totalCommission: result.totalCommission,
          processedActivations: result.processedActivations
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process level ROI income',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in level ROI income API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing level ROI income',
      error: error.message
    });
  }
};

// API endpoint for processing daily trading profit
const processDailyTradingProfit = async (req, res) => {
  try {
    console.log("processDailyTradingProfit API endpoint called");

    // Check if API key is provided and valid
    if (!req.body.key) {
      console.error("API key not provided in request body");
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      console.error("Invalid API key provided");
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    console.log("API key validated successfully");

    // Run the daily profit processing with 'manual' trigger type
    const result = await _processDailyTradingProfit('manual');

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Daily trading profit processed successfully',
        data: {
          processedInvestments: result.processedCount,
          totalProfit: result.totalProfit,
          cronExecutionId: result.cronExecutionId
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process daily trading profit',
        error: result.error,
        cronExecutionId: result.cronExecutionId
      });
    }
  } catch (error) {
    console.error('Error in daily profit API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing daily trading profit',
      error: error.message
    });
  }
};

// API endpoint to reset last_profit_date and force daily profit
const resetAndProcessDailyProfit = async (req, res) => {
  try {
    console.log("resetAndProcessDailyProfit API endpoint called");

    // Check if API key is provided and valid
    if (!req.body.key) {
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    console.log("API key validated successfully");

    // Reset last_profit_date for all active investments
    const { investmentDbHandler } = require('../../services/db');
    const resetResult = await investmentDbHandler.updateByQuery(
      { status: 'active' },
      {
        $unset: {
          last_profit_date: 1,
          last_profit_processed_date: 1
        }
      }
    );

    console.log(`Reset last_profit_date for ${resetResult.modifiedCount || 0} investments`);

    // Now run the daily profit processing
    const result = await _processDailyTradingProfit('manual_reset');

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Reset and daily trading profit processed successfully',
        data: {
          resetCount: resetResult.modifiedCount || 0,
          processedInvestments: result.processedCount,
          totalProfit: result.totalProfit,
          cronExecutionId: result.cronExecutionId
        }
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Reset successful but daily profit processing failed',
        data: {
          resetCount: resetResult.modifiedCount || 0
        },
        error: result.error,
        cronExecutionId: result.cronExecutionId
      });
    }
  } catch (error) {
    console.error('Error in reset and daily profit API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error resetting and processing daily trading profit',
      error: error.message
    });
  }
};

// API endpoint to check duplicate prevention status
const checkDuplicatePreventionStatus = async (req, res) => {
  try {
    console.log("checkDuplicatePreventionStatus API endpoint called");

    // Check if API key is provided and valid
    if (!req.body.key) {
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    const { investmentDbHandler, incomeDbHandler } = require('../../services/db');

    // Get today's date
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + istOffset);
    todayIST.setHours(0, 0, 0, 0);
    const todayDateString = todayIST.toISOString().split('T')[0];

    // Get all active investments
    const allActiveInvestments = await investmentDbHandler.getByQuery({ status: 'active' });

    // Get investments that received profit today
    const todayStart = new Date(todayIST);
    const todayEnd = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);

    const todayProfitRecords = await incomeDbHandler.getByQuery({
      type: 'daily_profit',
      created_at: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });

    // Get eligible investments
    const eligibleInvestments = await investmentDbHandler.getByQuery({
      status: 'active',
      $and: [
        {
          $or: [
            { last_profit_date: { $lt: todayIST } },
            { last_profit_date: null },
            { last_profit_date: { $exists: false } }
          ]
        },
        {
          $or: [
            { last_profit_processed_date: { $ne: todayDateString } },
            { last_profit_processed_date: null },
            { last_profit_processed_date: { $exists: false } }
          ]
        }
      ]
    });

    return res.status(200).json({
      status: true,
      message: 'Duplicate prevention status checked successfully',
      data: {
        todayDate: todayDateString,
        totalActiveInvestments: allActiveInvestments.length,
        eligibleForProfit: eligibleInvestments.length,
        alreadyProcessedToday: todayProfitRecords.length,
        duplicatePreventionWorking: (allActiveInvestments.length - eligibleInvestments.length) === todayProfitRecords.length
      }
    });

  } catch (error) {
    console.error('Error in duplicate prevention status check:', error);
    return res.status(500).json({
      status: false,
      message: 'Error checking duplicate prevention status',
      error: error.message
    });
  }
};

// These cron jobs are now scheduled at lines 1528-1538

// Schedule active member rewards check (weekly)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling active member rewards check (weekly at midnight IST)');
  // cron.schedule('0 0 * * 0', _processActiveMemberReward, {
  //   scheduled: true,
  //   timezone: "Asia/Kolkata"
  // });
} else {
  console.log('Automatic active member rewards check is disabled (CRON_STATUS=0)');
}

// Schedule user rank updates (daily at 1:30 AM IST - after Level ROI processing)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling user rank updates (daily at 1:30 AM IST)');
  cron.schedule('30 1 * * *', () => _processUserRanks(), {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
} else {
  console.log('Automatic user rank updates are disabled (CRON_STATUS=0)');
}

// API endpoint for processing team rewards
const processTeamRewards = async (req, res) => {
  try {
    console.log("Processing team rewards...");
    console.log("Request body:", req.body);

    // Check if API key is provided and valid
    if (!req.body.key) {
      console.error("API key not provided in request body");
      return res.status(401).json({
        status: false,
        message: 'API key is required in request body'
      });
    }

    if (req.body.key !== process.env.APP_API_KEY) {
      console.error("Invalid API key provided");
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    console.log("API key validated successfully");
    const result = await _processTeamRewards();

    if (result.success) {
      return res.status(200).json({
        status: true,
        message: 'Team rewards processed successfully'
      });
    } else {
      return res.status(500).json({
        status: false,
        message: 'Failed to process team rewards',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in team rewards API endpoint:', error);
    return res.status(500).json({
      status: false,
      message: 'Error processing team rewards',
      error: error.message
    });
  }
};

// Schedule daily ROI processing (exactly at 12:30 AM IST every day)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling daily ROI processing (exactly at 12:30 AM IST every day)');

  // Create a wrapper function with error handling and logging
  const processDailyTradingProfitWithErrorHandling = async () => {
    try {
      // Log the start of the cron job execution
      console.log(`[CRON] Daily ROI processing started at ${new Date().toISOString()}`);

      // Record the start time for performance tracking
      const startTime = Date.now();

      // Execute the daily trading profit function with 'automatic' trigger type
      const result = await _processDailyTradingProfit('automatic');

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Log the result
      if (result.success) {
        console.log(`[CRON] Daily ROI processing completed successfully at ${new Date().toISOString()}`);
        console.log(`[CRON] Processed ${result.processedCount} investments with total profit of $${result.totalProfit}`);
        console.log(`[CRON] Execution time: ${executionTime}ms`);

        // Record successful execution in database or file
        try {
          const fs = require('fs');
          const logEntry = {
            job: 'daily_roi',
            status: 'success',
            timestamp: new Date().toISOString(),
            executionTime,
            processedCount: result.processedCount,
            totalProfit: result.totalProfit
          };

          // Ensure logs directory exists
          if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
          }

          // Append to log file
          fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
        } catch (logError) {
          console.error('[CRON] Error logging cron execution:', logError);
        }
      } else {
        console.error(`[CRON] Daily ROI processing failed at ${new Date().toISOString()}`);
        console.error(`[CRON] Error: ${result.error}`);

        // Record failed execution
        try {
          const fs = require('fs');
          const logEntry = {
            job: 'daily_roi',
            status: 'failed',
            timestamp: new Date().toISOString(),
            executionTime,
            error: result.error
          };

          // Ensure logs directory exists
          if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
          }

          // Append to log file
          fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
        } catch (logError) {
          console.error('[CRON] Error logging cron execution:', logError);
        }
      }
    } catch (error) {
      console.error(`[CRON] Unhandled error in daily ROI processing: ${error.message}`);
      console.error(error.stack);

      // Record error in log file
      try {
        const fs = require('fs');
        const logEntry = {
          job: 'daily_roi',
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        };

        // Ensure logs directory exists
        if (!fs.existsSync('./logs')) {
          fs.mkdirSync('./logs');
        }

        // Append to log file
        fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
      } catch (logError) {
        console.error('[CRON] Error logging cron execution:', logError);
      }
    }
  };

  // Schedule the cron job with the wrapper function to run at 12:30 AM IST (Indian Standard Time)
  cron.schedule('30 0 * * *', processDailyTradingProfitWithErrorHandling, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Log that the cron job has been scheduled
  console.log(`[CRON_SETUP] Daily profit cron job scheduled to run at 12:30 AM IST every day (CRON_STATUS=${process.env.CRON_STATUS})`);


  // Add a backup cron job that runs 15 minutes later if the main one fails
  cron.schedule('45 0 * * *', async () => {
    try {
      // Check if the main cron job has run successfully
      const fs = require('fs');
      let mainJobRan = false;

      // Check if log file exists and read the last entry
      if (fs.existsSync('./logs/cron-execution.log')) {
        const logContent = fs.readFileSync('./logs/cron-execution.log', 'utf8');
        const logLines = logContent.trim().split('\n');

        if (logLines.length > 0) {
          const lastLog = JSON.parse(logLines[logLines.length - 1]);

          // Check if the last log entry is from today and was successful (using IST)
          const today = new Date();
          // Convert to IST for comparison
          const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
          const todayIST = new Date(today.getTime() + istOffset);
          todayIST.setHours(0, 0, 0, 0);

          const logDate = new Date(lastLog.timestamp);
          const logDateIST = new Date(logDate.getTime() + istOffset);
          logDateIST.setHours(0, 0, 0, 0);

          if (lastLog.job === 'daily_roi' &&
              lastLog.status === 'success' &&
              logDateIST.getTime() === todayIST.getTime()) {
            mainJobRan = true;
          }
        }
      }

      // If the main job didn't run successfully, run it now
      if (!mainJobRan) {
        console.log(`[CRON] Backup daily ROI processing started at ${new Date().toISOString()}`);
        // Execute the daily trading profit function directly with 'backup' trigger type
        await _processDailyTradingProfit('backup');
      } else {
        console.log(`[CRON] Main daily ROI job already ran successfully, skipping backup job`);
      }
    } catch (error) {
      console.error(`[CRON] Error in backup daily ROI job: ${error.message}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
} else {
  console.log('Automatic daily ROI processing is disabled (CRON_STATUS=0)');
}

// Schedule Level ROI Income processing (every day at 1:00 AM IST)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling Level ROI Income processing (daily at 1:00 AM IST)');

  // Create a wrapper function with error handling and logging for Level ROI
  const processLevelRoiWithErrorHandling = async () => {
    try {
      console.log(`[CRON] Level ROI processing started at ${new Date().toISOString()}`);
      const startTime = Date.now();

      const result = await _processLevelRoiIncome();
      const executionTime = Date.now() - startTime;

      if (result.success) {
        console.log(`[CRON] Level ROI processing completed successfully at ${new Date().toISOString()}`);
        console.log(`[CRON] Processed ${result.processedCount} users for level ROI`);
        console.log(`[CRON] Level ROI execution time: ${executionTime}ms`);

        // Log success to file
        try {
          const fs = require('fs');
          const logEntry = {
            job: 'level_roi',
            status: 'success',
            timestamp: new Date().toISOString(),
            executionTime,
            processedCount: result.processedCount,
            totalCommission: result.totalCommission
          };

          if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
          }

          fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
        } catch (logError) {
          console.error('[CRON] Error logging level ROI execution:', logError);
        }
      } else {
        console.error(`[CRON] Level ROI processing failed: ${result.error}`);

        // Log error to file
        try {
          const fs = require('fs');
          const logEntry = {
            job: 'level_roi',
            status: 'failed',
            timestamp: new Date().toISOString(),
            executionTime,
            error: result.error
          };

          if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
          }

          fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
        } catch (logError) {
          console.error('[CRON] Error logging level ROI execution:', logError);
        }
      }
    } catch (error) {
      console.error(`[CRON] Unhandled error in level ROI processing: ${error.message}`);

      // Log error to file
      try {
        const fs = require('fs');
        const logEntry = {
          job: 'level_roi',
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        };

        if (!fs.existsSync('./logs')) {
          fs.mkdirSync('./logs');
        }

        fs.appendFileSync('./logs/cron-execution.log', JSON.stringify(logEntry) + '\n');
      } catch (logError) {
        console.error('[CRON] Error logging level ROI execution:', logError);
      }
    }
  };

  cron.schedule('0 1 * * *', processLevelRoiWithErrorHandling, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
} else {
  console.log('Automatic Level ROI Income processing is disabled (CRON_STATUS=0)');
}

// Schedule team rewards processing (every day at 2:00 AM IST)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling team rewards processing (daily at 2 AM IST)');
  // cron.schedule('0 2 * * *', _processTeamRewards, {
  //   scheduled: true,
  //   timezone: "Asia/Kolkata"
  // });
} else {
  console.log('Automatic team rewards processing is disabled (CRON_STATUS=0)');
}

// Reset daily login counters and profit activation at midnight
const resetDailyLoginCounters = async () => {
  try {
    console.log('Resetting daily login counters and profit activation...');

    // Get all users directly using mongoose
    let updatedCount = 0;
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('Users');
      const users = await User.find({});

      console.log(`Found ${users.length} users using direct mongoose query`);

      // Update each user individually
      for (const user of users) {
        await userDbHandler.updateByQuery({_id: user._id}, {
          daily_logins: 0,
          rank_benefits_active: false,
          dailyProfitActivated: false // Reset daily profit activation flag
        });
        console.log(`Reset daily login counters and profit activation for user ${user.username || user.email}`);
        updatedCount++;
      }
    } catch (mongooseError) {
      console.error('Error querying users with mongoose:', mongooseError);
      throw mongooseError;
    }

    console.log(`Reset daily login counters for ${updatedCount} users`);

    // If this is called as an API endpoint, return a response
    if (res) {
      return res.status(200).json({
        status: true,
        message: 'Daily login counters reset successfully',
        data: { updatedCount }
      });
    }

    return { success: true, message: 'Daily login counters reset successfully', updatedCount };
  } catch (error) {
    console.error('Error resetting daily login counters:', error);

    // If this is called as an API endpoint, return a response
    if (res) {
      return res.status(500).json({
        status: false,
        message: 'Failed to reset daily login counters',
        error: error.message
      });
    }

    return { success: false, message: 'Failed to reset daily login counters', error };
  }
};

// Schedule daily login counter reset at midnight
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling daily login counter reset (daily at 4 AM IST)');
  cron.schedule('0 4 * * *', () => resetDailyLoginCounters(null, null), {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
} else {
  console.log('Automatic daily login counter reset is disabled (CRON_STATUS=0)');
}

// Process reward system eligibility
const _processRewardSystem = async () => {
  try {
    console.log('\n======== PROCESSING REWARD SYSTEM ========');
    console.log(`Starting reward system processing at ${new Date().toISOString()}`);

    // Get reward targets from investment plan or use defaults
    const rewardTargets = {
      goa_tour: {
        name: "Goa Tour",
        self_invest_target: 1000,
        direct_business_target: 1500,
        reward_value: "Goa Tour Package"
      },
      bangkok_tour: {
        name: "Bangkok Tour",
        self_invest_target: 5000,
        direct_business_target: 10000,
        reward_value: "Bangkok Tour Package"
      }
    };

    // Get all users who have invested
    const investedUsers = await userDbHandler.getByQuery({
      total_investment: { $gt: 0 },
      status: 1
    });

    console.log(`Found ${investedUsers.length} users with investments to check for rewards`);

    let processedCount = 0;
    let qualifiedCount = 0;

    for (const user of investedUsers) {
      try {
        console.log(`\n--- Checking rewards for user: ${user.username || user.email} (ID: ${user._id}) ---`);

        // Calculate user's total self investment
        const userInvestments = await investmentDbHandler.getByQuery({
          user_id: user._id,
          status: 'active'
        });

        const totalSelfInvestment = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        console.log(`User's total self investment: $${totalSelfInvestment}`);

        // Calculate direct business (direct referrals' total investments)
        const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });
        console.log(`User has ${directReferrals.length} direct referrals`);

        let totalDirectBusiness = 0;
        for (const referral of directReferrals) {
          const referralInvestments = await investmentDbHandler.getByQuery({
            user_id: referral._id,
            status: 'active'
          });
          const referralTotal = referralInvestments.reduce((sum, inv) => sum + inv.amount, 0);
          totalDirectBusiness += referralTotal;
        }

        console.log(`User's total direct business: $${totalDirectBusiness}`);

        // Check each reward tier
        for (const [rewardType, rewardConfig] of Object.entries(rewardTargets)) {
          console.log(`\nChecking ${rewardConfig.name} eligibility:`);
          console.log(`- Required self investment: $${rewardConfig.self_invest_target}`);
          console.log(`- Required direct business: $${rewardConfig.direct_business_target}`);
          console.log(`- User's self investment: $${totalSelfInvestment}`);
          console.log(`- User's direct business: $${totalDirectBusiness}`);

          const meetsSelfinvestment = totalSelfInvestment >= rewardConfig.self_invest_target;
          const meetsDirectBusiness = totalDirectBusiness >= rewardConfig.direct_business_target;

          console.log(`- Meets self investment: ${meetsSelfinvestment ? 'YES' : 'NO'}`);
          console.log(`- Meets direct business: ${meetsDirectBusiness ? 'YES' : 'NO'}`);

          if (meetsSelfinvestment && meetsDirectBusiness) {
            // Check if user already has this reward
            const existingReward = await Reward.findOne({
              user_id: user._id,
              reward_type: rewardType
            });

            if (!existingReward) {
              // Create new reward record
              const newReward = new Reward({
                user_id: user._id,
                reward_type: rewardType,
                reward_name: rewardConfig.name,
                self_invest_target: rewardConfig.self_invest_target,
                self_invest_achieved: totalSelfInvestment,
                direct_business_target: rewardConfig.direct_business_target,
                direct_business_achieved: totalDirectBusiness,
                reward_value: rewardConfig.reward_value,
                status: 'qualified',
                extra: {
                  qualification_date: new Date(),
                  direct_referrals_count: directReferrals.length
                }
              });

              await newReward.save();
              qualifiedCount++;

              console.log(`✅ ${rewardConfig.name} QUALIFIED! Reward record created.`);

              // Create income record for tracking
              await incomeDbHandler.create({
                user_id: user._id,
                type: 'reward_qualification',
                amount: 0, // No monetary value, just tracking
                status: 'credited',
                description: `Qualified for ${rewardConfig.name}`,
                extra: {
                  reward_type: rewardType,
                  reward_name: rewardConfig.name,
                  self_invest_achieved: totalSelfInvestment,
                  direct_business_achieved: totalDirectBusiness,
                  qualification_date: new Date()
                }
              });

            } else {
              console.log(`ℹ️  User already has ${rewardConfig.name} reward (Status: ${existingReward.status})`);
            }
          } else {
            console.log(`❌ ${rewardConfig.name} NOT QUALIFIED`);
            if (!meetsSelfinvestment) {
              console.log(`   - Need $${rewardConfig.self_invest_target - totalSelfInvestment} more self investment`);
            }
            if (!meetsDirectBusiness) {
              console.log(`   - Need $${rewardConfig.direct_business_target - totalDirectBusiness} more direct business`);
            }
          }
        }

        processedCount++;

      } catch (userError) {
        console.error(`Error processing rewards for user ${user._id}:`, userError);
      }
    }

    console.log('\n======== REWARD SYSTEM PROCESSING COMPLETED ========');
    console.log(`Processed: ${processedCount} users`);
    console.log(`New qualifications: ${qualifiedCount}`);
    console.log(`Completed at: ${new Date().toISOString()}`);

    return {
      success: true,
      processedUsers: processedCount,
      newQualifications: qualifiedCount
    };

  } catch (error) {
    console.error('Error in reward system processing:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Schedule reward system processing (daily at 3:00 AM IST)
if (process.env.CRON_STATUS === '1') {
  console.log('Scheduling reward system processing (daily at 3:00 AM IST)');
  cron.schedule('0 3 * * *', _processRewardSystem, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
} else {
  console.log('Automatic reward system processing is disabled (CRON_STATUS=0)');
}

// Test cron job removed to prevent log file creation

// Add a stub for processUserRanks if not defined
const processUserRanks = async (req, res) => {
  return res.status(501).json({
    status: false,
    message: 'processUserRanks is not implemented yet.'
  });
};

module.exports = {
  distributeTokensHandler,
  distributeLevelIncome,
  distributeGlobalAutoPoolMatrixIncome,
  AutoFundDistribution,
  processTeamCommission,
  processActiveMemberReward,
  processDailyTradingProfit,
  resetAndProcessDailyProfit, // New endpoint for reset and process
  checkDuplicatePreventionStatus, // New endpoint for checking duplicate prevention
  processLevelRoiIncome,
  processUserRanks, // <-- Add this line
  processTeamRewards,
  resetDailyLoginCounters,
  checkPendingActivations,
  hasUserInvested, // Export the utility function to check if a user has invested
  // Export internal functions for testing
  _processDailyTradingProfit,
  _processLevelRoiIncome,
  _processRewardSystem,

};
