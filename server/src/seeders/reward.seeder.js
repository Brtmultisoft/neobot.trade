'use strict';

const Reward = require('../models/reward.model');
const User = require('../models/user.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Seed sample reward data for testing
 */
const seedRewards = async () => {
    try {
        log.info('Starting reward seeding...');

        // Clear existing rewards to reseed fresh data
        const existingRewards = await Reward.countDocuments();
        if (existingRewards > 0) {
            log.info(`Found ${existingRewards} existing rewards, clearing them for fresh seeding`);
            await Reward.deleteMany({});
            log.info('Cleared existing rewards');
        }

        // Get some users to assign rewards to
        let users = await User.find().limit(5);
        let createdUsers = 0;

        if (users.length === 0) {
            log.warn('No users found, creating sample users for rewards');

            // Create sample users for testing
            const sampleUsers = [];
            for (let i = 1; i <= 3; i++) {
                try {
                    const existingUser = await User.findOne({ username: `testuser${i}` });
                    if (!existingUser) {
                        const user = new User({
                            username: `testuser${i}`,
                            email: `testuser${i}@example.com`,
                            password: 'testpassword123', // This will be hashed by the pre-save hook
                            total_investment: Math.floor(Math.random() * 10000) + 1000,
                            wallet: Math.floor(Math.random() * 1000) + 100,
                            status: true,
                            phone_number: `+1234567890${i}`, // Unique phone number
                            sponsorID: `TEST${i.toString().padStart(3, '0')}`
                        });
                        await user.save();
                        sampleUsers.push(user);
                        createdUsers++;
                    } else {
                        sampleUsers.push(existingUser);
                    }
                } catch (userError) {
                    log.error(`Error creating user ${i}:`, userError.message);
                    // Continue with other users
                }
            }
            users = sampleUsers;
            log.info(`Created ${createdUsers} new sample users for testing`);
        }

        // Reward configurations based on your business requirements
        const rewardTypes = [
            {
                ser_no: 1,
                type: 'goa_tour',
                name: 'Goa Tour',
                self_invest_target: 1000,
                direct_business_target: 1500,
                reward_value: 'Goa Tour Package',
                remarks: ''
            },
            {
                ser_no: 2,
                type: 'bangkok_tour',
                name: 'Bangkok Tour',
                self_invest_target: 2500,
                direct_business_target: 5000,
                reward_value: 'Bangkok Tour Package',
                remarks: ''
            },
            {
                ser_no: 3,
                type: 'coupon_code',
                name: 'Coupon code',
                self_invest_target: 500,
                direct_business_target: 800,
                reward_value: 'Special Coupon Code',
                remarks: ''
            },
            {
                ser_no: 4,
                type: 'car_reward',
                name: 'Car',
                self_invest_target: 10000,
                direct_business_target: 5000,
                reward_value: 'Car Reward',
                remarks: '$5000 Monthly Business every month'
            },
            {
                ser_no: 5,
                type: 'bike_reward',
                name: 'Book Your Bike',
                self_invest_target: 7000,
                direct_business_target: 4000,
                reward_value: 'Bike Booking Reward',
                remarks: ''
            }
        ];

        const statuses = ['qualified', 'approved', 'processed', 'completed'];
        const sampleRewards = [];

        // Create sample rewards for each user
        users.forEach((user, userIndex) => {
            rewardTypes.forEach((rewardType, typeIndex) => {
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                // Generate realistic progress values
                const selfInvestAchieved = Math.floor(Math.random() * rewardType.self_invest_target * 1.5);
                const directBusinessAchieved = Math.floor(Math.random() * rewardType.direct_business_target * 1.5);
                
                const reward = {
                    user_id: user._id,
                    reward_type: rewardType.type,
                    reward_name: rewardType.name,
                    self_invest_target: rewardType.self_invest_target,
                    self_invest_achieved: selfInvestAchieved,
                    direct_business_target: rewardType.direct_business_target,
                    direct_business_achieved: directBusinessAchieved,
                    qualification_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                    status: status,
                    reward_value: rewardType.reward_value,
                    notes: status === 'completed' ? 'Reward completed successfully' :
                           status === 'approved' ? 'Approved by admin' :
                           rewardType.remarks || '',
                    processed_at: ['processed', 'completed'].includes(status) ? new Date() : null,
                    extra: {
                        ser_no: rewardType.ser_no,
                        remarks: rewardType.remarks,
                        self_invest_formatted: `$${rewardType.self_invest_target}`,
                        target_business_formatted: `$${rewardType.direct_business_target}`,
                        qualification_percentage: {
                            self_invest: Math.round((selfInvestAchieved / rewardType.self_invest_target) * 100),
                            direct_business: Math.round((directBusinessAchieved / rewardType.direct_business_target) * 100)
                        }
                    }
                };

                sampleRewards.push(reward);
            });
        });

        // Insert sample rewards
        if (sampleRewards.length === 0) {
            log.warn('No sample rewards to insert');
            return {
                success: true,
                message: 'No rewards to seed',
                data: {
                    totalRewards: 0,
                    statusBreakdown: []
                }
            };
        }

        const insertedRewards = await Reward.insertMany(sampleRewards);
        log.info(`Successfully seeded ${insertedRewards.length} sample rewards`);

        // Log summary
        const statusCounts = await Reward.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        log.info('Reward status summary:', statusCounts);

        return {
            success: true,
            message: `Successfully seeded ${insertedRewards.length} sample rewards`,
            data: {
                totalRewards: insertedRewards.length,
                statusBreakdown: statusCounts,
                usersCreated: createdUsers,
                totalUsers: users.length
            }
        };

    } catch (error) {
        log.error('Error seeding rewards:', error);
        throw error;
    }
};

/**
 * Clear all reward data
 */
const clearRewards = async () => {
    try {
        log.info('Clearing all reward data...');
        const result = await Reward.deleteMany({});
        log.info(`Cleared ${result.deletedCount} rewards`);
        return result;
    } catch (error) {
        log.error('Error clearing rewards:', error);
        throw error;
    }
};

/**
 * Get reward statistics
 */
const getRewardStats = async () => {
    try {
        const totalRewards = await Reward.countDocuments();
        
        const statusStats = await Reward.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const typeStats = await Reward.aggregate([
            {
                $group: {
                    _id: '$reward_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalRewards,
            statusStats,
            typeStats
        };
    } catch (error) {
        log.error('Error getting reward stats:', error);
        throw error;
    }
};

module.exports = {
    seedRewards,
    clearRewards,
    getRewardStats
};
