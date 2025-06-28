"use strict";

const Reward = require('../../models/reward.model');
const { userDbHandler, investmentDbHandler } = require('../../services/db');
const { ObjectId } = require('mongodb');
const RewardMaster = require('../../models/reward.master.model');

// Get user's reward status and progress
const getUserRewardStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get reward targets
    const rewardTargets = {
      goa_tour: {
        name: "Goa Tour",
        self_invest_target: 1000,
        direct_business_target: 1500,
        reward_value: "Goa Tour Package",
        description: "Enjoy a luxurious Goa tour package with accommodation and sightseeing"
      },
      bangkok_tour: {
        name: "Bangkok Tour",
        self_invest_target: 5000,
        direct_business_target: 10000,
        reward_value: "Bangkok Tour Package",
        description: "Experience the vibrant culture of Bangkok with premium tour package"
      }
    };

    // Get user's current investments
    const userInvestments = await investmentDbHandler.getByQuery({
      user_id: ObjectId(userId),
      status: 'active'
    });

    const totalSelfInvestment = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    // Get direct referrals and their investments
    const directReferrals = await userDbHandler.getByQuery({ 
      refer_id: ObjectId(userId) 
    });

    let totalDirectBusiness = 0;
    const directReferralDetails = [];

    for (const referral of directReferrals) {
      const referralInvestments = await investmentDbHandler.getByQuery({
        user_id: referral._id,
        status: 'active'
      });
      const referralTotal = referralInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      totalDirectBusiness += referralTotal;

      directReferralDetails.push({
        username: referral.username || referral.email,
        totalInvestment: referralTotal,
        joinDate: referral.created_at
      });
    }

    // Get user's existing rewards
    const userRewards = await Reward.find({ user_id: ObjectId(userId) });

    // Calculate progress for each reward
    const rewardProgress = {};

    for (const [rewardType, rewardConfig] of Object.entries(rewardTargets)) {
      const existingReward = userRewards.find(r => r.reward_type === rewardType);
      
      const selfInvestmentProgress = Math.min((totalSelfInvestment / rewardConfig.self_invest_target) * 100, 100);
      const directBusinessProgress = Math.min((totalDirectBusiness / rewardConfig.direct_business_target) * 100, 100);
      
      const isQualified = totalSelfInvestment >= rewardConfig.self_invest_target && 
                         totalDirectBusiness >= rewardConfig.direct_business_target;

      rewardProgress[rewardType] = {
        ...rewardConfig,
        current_self_investment: totalSelfInvestment,
        current_direct_business: totalDirectBusiness,
        self_investment_progress: selfInvestmentProgress,
        direct_business_progress: directBusinessProgress,
        overall_progress: Math.min((selfInvestmentProgress + directBusinessProgress) / 2, 100),
        is_qualified: isQualified,
        status: existingReward ? existingReward.status : 'not_qualified',
        qualification_date: existingReward ? existingReward.qualification_date : null,
        remaining_self_investment: Math.max(rewardConfig.self_invest_target - totalSelfInvestment, 0),
        remaining_direct_business: Math.max(rewardConfig.direct_business_target - totalDirectBusiness, 0)
      };
    }

    res.status(200).json({
      success: true,
      data: {
        user_summary: {
          total_self_investment: totalSelfInvestment,
          total_direct_business: totalDirectBusiness,
          direct_referrals_count: directReferrals.length
        },
        reward_progress: rewardProgress,
        direct_referrals: directReferralDetails,
        qualified_rewards: userRewards.filter(r => r.status !== 'not_qualified')
      }
    });

  } catch (error) {
    console.error('Error fetching user reward status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward status',
      error: error.message
    });
  }
};

// Get user's reward history
const getUserRewardHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const rewards = await Reward.find({ user_id: ObjectId(userId) })
      .sort({ qualification_date: -1 });

    res.status(200).json({
      success: true,
      data: rewards
    });

  } catch (error) {
    console.error('Error fetching user reward history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward history',
      error: error.message
    });
  }
};

// Get reward leaderboard
const getRewardLeaderboard = async (req, res) => {
  try {
    const { reward_type, limit = 50 } = req.query;

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          status: { $in: ['qualified', 'approved', 'completed'] }
        }
      }
    ];

    if (reward_type) {
      pipeline.push({
        $match: { reward_type: reward_type }
      });
    }

    pipeline.push(
      {
        $sort: { qualification_date: 1 } // First qualified gets higher rank
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          reward_name: 1,
          reward_type: 1,
          qualification_date: 1,
          status: 1,
          self_invest_achieved: 1,
          direct_business_achieved: 1,
          'user.username': 1,
          'user.email': 1
        }
      }
    );

    const leaderboard = await Reward.aggregate(pipeline);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      data: rankedLeaderboard
    });

  } catch (error) {
    console.error('Error fetching reward leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

// Get reward targets and requirements
const getRewardTargets = async (req, res) => {
  try {
    const rewardTargets = {
      goa_tour: {
        name: "Goa Tour",
        self_invest_target: 1000,
        direct_business_target: 1500,
        reward_value: "Goa Tour Package",
        description: "Enjoy a luxurious Goa tour package with accommodation and sightseeing",
        features: [
          "3 Days / 2 Nights accommodation",
          "All meals included",
          "Sightseeing tours",
          "Transportation included"
        ]
      },
      bangkok_tour: {
        name: "Bangkok Tour",
        self_invest_target: 5000,
        direct_business_target: 10000,
        reward_value: "Bangkok Tour Package",
        description: "Experience the vibrant culture of Bangkok with premium tour package",
        features: [
          "5 Days / 4 Nights accommodation",
          "Premium hotel stay",
          "Cultural tours and shopping",
          "Airport transfers included"
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: rewardTargets
    });

  } catch (error) {
    console.error('Error fetching reward targets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward targets',
      error: error.message
    });
  }
};

// POST /user/rewards/apply
const applyForReward = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const { reward_id } = req.body;
    if (!userId || !reward_id) {
      return res.status(400).json({ success: false, message: 'User ID and reward_id are required' });
    }
    // Find reward master
    const rewardMaster = await RewardMaster.findById(reward_id);
    if (!rewardMaster) return res.status(404).json({ success: false, message: 'Reward not found' });
    // Fallback: If reward_type is missing, generate from reward_name
    let rewardType = rewardMaster.reward_type;
    if (!rewardType || rewardType.trim() === '') {
      rewardType = rewardMaster.reward_name.toLowerCase().replace(/ /g, '_');
    }
    // Check if already applied
    const already = await Reward.findOne({ user_id: userId, reward_type: rewardType });
    if (already) return res.status(400).json({ success: false, message: 'Already applied' });

    // Calculate actual achievements
    // 1. Self investment
    const userInvestments = await investmentDbHandler.getByQuery({ user_id: ObjectId(userId), status: 'active' });
    const selfInvestAchieved = userInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    // 2. Direct business
    const directReferrals = await userDbHandler.getByQuery({ refer_id: ObjectId(userId) });
    let directBusinessAchieved = 0;
    for (const referral of directReferrals) {
      const referralInvestments = await investmentDbHandler.getByQuery({ user_id: referral._id, status: 'active' });
      directBusinessAchieved += referralInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    }

    // Create reward application with all details
    await Reward.create({
      user_id: ObjectId(userId),
      reward_master_id: rewardMaster._id,
      reward_type: rewardType,
      reward_name: rewardMaster.reward_name,
      self_invest_target: rewardMaster.self_invest_target,
      self_invest_achieved: selfInvestAchieved,
      direct_business_target: rewardMaster.direct_business_target,
      direct_business_achieved: directBusinessAchieved,
      qualification_date: new Date(),
      status: 'qualified',
      reward_value: rewardMaster.reward_value,
      notes: 'User applied manually'
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all reward applications for the logged-in user
const getUserRewardApplications = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }
    const rewards = await Reward.find({ user_id: userId }).sort({ qualification_date: -1 });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = {
  getUserRewardStatus,
  getUserRewardHistory,
  getRewardLeaderboard,
  getRewardTargets,
  applyForReward,
  getUserRewardApplications
};
