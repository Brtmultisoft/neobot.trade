"use strict";

const Reward = require('../../models/reward.model');
const { userDbHandler, investmentDbHandler, incomeDbHandler } = require('../../services/db');
const mongoose = require('mongoose');

// Get all rewards with pagination and filters
const getAllRewards = async (req, res) => {
  try {
    console.log('getAllRewards called with query:', req.query);

    const {
      page = 1,
      limit = 20,
      status,
      reward_type,
      user_id,
      start_date,
      end_date
    } = req.query;

    // Build filter query
    const filter = {};

    if (status) filter.status = status;
    if (reward_type) filter.reward_type = reward_type;
    if (user_id) {
      try {
        filter.user_id = new mongoose.Types.ObjectId(user_id);
      } catch (err) {
        console.error('Invalid user_id format:', user_id);
        return res.status(400).json({
          success: false,
          message: 'Invalid user_id format'
        });
      }
    }

    if (start_date || end_date) {
      filter.qualification_date = {};
      if (start_date) filter.qualification_date.$gte = new Date(start_date);
      if (end_date) filter.qualification_date.$lte = new Date(end_date);
    }

    console.log('Filter applied:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count first
    const totalRewards = await Reward.countDocuments(filter);
    console.log('Total rewards found:', totalRewards);

    // Get rewards (try to populate user details, but continue if it fails)
    let rewards;
    try {
      rewards = await Reward.find(filter)
        .populate({
          path: 'user_id',
          select: 'username email total_investment',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'processed_by',
          select: 'username email',
          options: { strictPopulate: false }
        })
        .sort({ qualification_date: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    } catch (populateError) {
      console.log('Population failed, fetching rewards without user details:', populateError.message);
      // If population fails, get rewards without user details
      rewards = await Reward.find(filter)
        .sort({ qualification_date: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    console.log('Rewards fetched:', rewards.length);

    // Process rewards to handle missing user data
    const processedRewards = rewards.map(reward => {
      const rewardObj = reward.toObject();

      // If user_id is null, undefined, or just an ObjectId string, create a placeholder
      if (!rewardObj.user_id || typeof rewardObj.user_id === 'string') {
        const userId = typeof rewardObj.user_id === 'string' ? rewardObj.user_id : 'unknown';
        rewardObj.user_id = {
          _id: userId,
          username: `User ${userId.slice(-4)}`,
          email: `user${userId.slice(-4)}@example.com`,
          total_investment: 0
        };
      }

      return rewardObj;
    });

    // Calculate statistics only if there are rewards
    let stats = [];
    if (totalRewards > 0) {
      stats = await Reward.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: 1 }
          }
        }
      ]);
    }

    const response = {
      success: true,
      data: {
        rewards: processedRewards || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRewards / parseInt(limit)) || 1,
          totalRewards: totalRewards || 0,
          limit: parseInt(limit)
        },
        statistics: stats || []
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching rewards:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching rewards',
      error: error.message
    });
  }
};

// Get reward details by ID
const getRewardById = async (req, res) => {
  try {
    const { id } = req.params;

    const reward = await Reward.findById(id)
      .populate('user_id', 'username email total_investment wallet')
      .populate('processed_by', 'username email');

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Get user's current investment and direct business
    const userInvestments = await investmentDbHandler.getByQuery({
      user_id: reward.user_id._id,
      status: 'active'
    });

    const directReferrals = await userDbHandler.getByQuery({ 
      refer_id: reward.user_id._id 
    });

    let totalDirectBusiness = 0;
    for (const referral of directReferrals) {
      const referralInvestments = await investmentDbHandler.getByQuery({
        user_id: referral._id,
        status: 'active'
      });
      totalDirectBusiness += referralInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    }

    const rewardDetails = {
      ...reward.toObject(),
      current_stats: {
        current_self_investment: userInvestments.reduce((sum, inv) => sum + inv.amount, 0),
        current_direct_business: totalDirectBusiness,
        direct_referrals_count: directReferrals.length
      }
    };

    res.status(200).json({
      success: true,
      data: rewardDetails
    });

  } catch (error) {
    console.error('Error fetching reward details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward details',
      error: error.message
    });
  }
};

// Approve reward
const approveReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.id || req.body.admin_id;

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (reward.status !== 'qualified') {
      return res.status(400).json({
        success: false,
        message: 'Only qualified rewards can be approved'
      });
    }

    // Update reward status
    reward.status = 'approved';
    reward.processed_by = adminId;
    reward.processed_at = new Date();
    reward.notes = notes || '';
    
    await reward.save();

    // Create income record for approval
    await incomeDbHandler.create({
      user_id: reward.user_id,
      type: 'reward_approved',
      amount: 0,
      status: 'credited',
      description: `${reward.reward_name} approved by admin`,
      extra: {
        reward_id: reward._id,
        reward_type: reward.reward_type,
        approved_by: adminId,
        approval_date: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reward approved successfully',
      data: reward
    });

  } catch (error) {
    console.error('Error approving reward:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving reward',
      error: error.message
    });
  }
};

// Process reward (mark as completed)
const processReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.id || req.body.admin_id;

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (reward.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved rewards can be processed'
      });
    }

    // Update reward status
    reward.status = 'completed';
    reward.processed_by = adminId;
    reward.processed_at = new Date();
    reward.notes = notes || '';
    
    await reward.save();

    // Create income record for completion
    await incomeDbHandler.create({
      user_id: reward.user_id,
      type: 'reward_completed',
      amount: 0,
      status: 'credited',
      description: `${reward.reward_name} completed`,
      extra: {
        reward_id: reward._id,
        reward_type: reward.reward_type,
        completed_by: adminId,
        completion_date: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reward processed successfully',
      data: reward
    });

  } catch (error) {
    console.error('Error processing reward:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing reward',
      error: error.message
    });
  }
};

// Get reward statistics
const getRewardStatistics = async (req, res) => {
  try {
    console.log('getRewardStatistics called');

    // Check if there are any rewards first
    const totalRewards = await Reward.countDocuments();
    console.log('Total rewards in database:', totalRewards);

    let stats = [];
    let monthlyTrends = [];

    if (totalRewards > 0) {
      stats = await Reward.aggregate([
        {
          $group: {
            _id: {
              reward_type: '$reward_type',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.reward_type',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        }
      ]);

      // Get monthly qualification trends
      monthlyTrends = await Reward.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$qualification_date' },
              month: { $month: '$qualification_date' },
              reward_type: '$reward_type'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        },
        {
          $limit: 12
        }
      ]);
    }

    const response = {
      success: true,
      data: {
        rewardStats: stats || [],
        monthlyTrends: monthlyTrends || [],
        totalRewards
      }
    };

    console.log('Statistics response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching reward statistics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward statistics',
      error: error.message
    });
  }
};

// Manual reward processing trigger
const triggerRewardProcessing = async (req, res) => {
  try {
    // Import the reward processing function
    const { _processRewardSystem } = require('../user/cron.controller');
    
    const result = await _processRewardSystem();

    res.status(200).json({
      success: true,
      message: 'Reward processing completed',
      data: result
    });

  } catch (error) {
    console.error('Error triggering reward processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering reward processing',
      error: error.message
    });
  }
};

module.exports = {
  getAllRewards,
  getRewardById,
  approveReward,
  processReward,
  getRewardStatistics,
  triggerRewardProcessing
};
