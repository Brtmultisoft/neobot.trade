'use strict';
const RewardMaster = require('../../models/reward.master.model');
const { ObjectId } = require('mongodb');

module.exports = {
    // Create a new reward master
    createRewardMaster: async (req, res) => {
        try {
            const data = req.body;
            if (!data.reward_type || !data.reward_name || !data.reward_value || !data.self_invest_target || !data.direct_business_target) {
                return res.status(400).json({
                    status: false,
                    message: 'Missing required fields.'
                });
            }
            const rewardMaster = await RewardMaster.create(data);
            return res.status(201).json({
                status: true,
                message: 'Reward master created successfully',
                result: rewardMaster
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to create reward master',
                error: error.message
            });
        }
    },

    // Get all reward masters
    getAllRewardMasters: async (req, res) => {
        try {
            const result = await RewardMaster.find({});
            return res.status(200).json({
                status: true,
                message: 'Reward masters retrieved successfully',
                result
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve reward masters',
                error: error.message
            });
        }
    },

    // Get a single reward master by ID
    getRewardMasterById: async (req, res) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid reward master ID'
                });
            }
            const rewardMaster = await RewardMaster.findById(id);
            if (!rewardMaster) {
                return res.status(404).json({
                    status: false,
                    message: 'Reward master not found'
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Reward master retrieved successfully',
                result: rewardMaster
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve reward master',
                error: error.message
            });
        }
    },

    // Update a reward master by ID
    updateRewardMaster: async (req, res) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid reward master ID'
                });
            }
            const updated = await RewardMaster.findByIdAndUpdate(id, req.body, { new: true });
            if (!updated) {
                return res.status(404).json({
                    status: false,
                    message: 'Reward master not found'
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Reward master updated successfully',
                result: updated
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to update reward master',
                error: error.message
            });
        }
    },

    // Delete a reward master by ID
    deleteRewardMaster: async (req, res) => {
        try {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid reward master ID'
                });
            }
            const deleted = await RewardMaster.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({
                    status: false,
                    message: 'Reward master not found'
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Reward master deleted successfully'
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to delete reward master',
                error: error.message
            });
        }
    }
}; 