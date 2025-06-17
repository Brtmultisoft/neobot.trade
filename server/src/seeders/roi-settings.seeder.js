'use strict';
const Setting = require('../models/setting.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Seed ROI range settings for dynamic ROI calculation
 */
const seedROISettings = async () => {
    try {
        log.info('Creating ROI range settings...');

        // Define ROI range settings
        const roiSettings = [
            {
                name: 'silver_package_monthly_roi_min',
                value: '20',
                extra: {
                    description: 'Minimum monthly ROI percentage for Silver package',
                    type: 'number',
                    category: 'roi_settings'
                }
            },
            {
                name: 'silver_package_monthly_roi_max',
                value: '30',
                extra: {
                    description: 'Maximum monthly ROI percentage for Silver package',
                    type: 'number',
                    category: 'roi_settings'
                }
            },
            {
                name: 'gold_package_monthly_roi_min',
                value: '30',
                extra: {
                    description: 'Minimum monthly ROI percentage for Gold package',
                    type: 'number',
                    category: 'roi_settings'
                }
            },
            {
                name: 'gold_package_monthly_roi_max',
                value: '40',
                extra: {
                    description: 'Maximum monthly ROI percentage for Gold package',
                    type: 'number',
                    category: 'roi_settings'
                }
            },
            {
                name: 'silver_package_amount_threshold',
                value: '5000',
                extra: {
                    description: 'Amount threshold to determine Silver vs Gold package (amounts below this are Silver)',
                    type: 'number',
                    category: 'roi_settings'
                }
            },
            {
                name: 'withdrawal_fee_percentage',
                value: '10',
                extra: {
                    description: 'Withdrawal fee percentage charged on all withdrawals',
                    type: 'number',
                    category: 'withdrawal_settings'
                }
            },
            {
                name: 'minimum_withdrawal_amount',
                value: '20',
                extra: {
                    description: 'Minimum withdrawal amount allowed in USD',
                    type: 'number',
                    category: 'withdrawal_settings'
                }
            }
        ];

        // Create or update each setting
        for (const settingData of roiSettings) {
            const existingSetting = await Setting.findOne({ name: settingData.name });
            
            if (existingSetting) {
                // Update existing setting
                await Setting.findOneAndUpdate(
                    { name: settingData.name },
                    {
                        $set: {
                            value: settingData.value,
                            extra: settingData.extra,
                            status: true,
                            updated_at: new Date()
                        }
                    }
                );
                log.info(`Updated ROI setting: ${settingData.name} = ${settingData.value}`);
            } else {
                // Create new setting
                await Setting.create(settingData);
                log.info(`Created ROI setting: ${settingData.name} = ${settingData.value}`);
            }
        }

        log.info('ROI range settings seeded successfully!');
        return { success: true, message: 'ROI settings seeded successfully' };

    } catch (error) {
        log.error('Error seeding ROI settings:', error);
        throw error;
    }
};

/**
 * Get ROI ranges from database
 */
const getROIRanges = async () => {
    try {
        const settings = await Setting.find({
            name: {
                $in: [
                    'silver_package_monthly_roi_min',
                    'silver_package_monthly_roi_max',
                    'gold_package_monthly_roi_min',
                    'gold_package_monthly_roi_max',
                    'silver_package_amount_threshold',
                    'withdrawal_fee_percentage',
                    'minimum_withdrawal_amount'
                ]
            },
            status: true
        });

        const roiRanges = {};
        settings.forEach(setting => {
            roiRanges[setting.name] = parseFloat(setting.value);
        });

        // Set defaults if settings not found
        return {
            silverMinROI: roiRanges.silver_package_monthly_roi_min || 20,
            silverMaxROI: roiRanges.silver_package_monthly_roi_max || 30,
            goldMinROI: roiRanges.gold_package_monthly_roi_min || 30,
            goldMaxROI: roiRanges.gold_package_monthly_roi_max || 40,
            amountThreshold: roiRanges.silver_package_amount_threshold || 5000,
            withdrawalFeePercentage: roiRanges.withdrawal_fee_percentage || 10,
            minimumWithdrawalAmount: roiRanges.minimum_withdrawal_amount || 20
        };

    } catch (error) {
        log.error('Error fetching ROI ranges from database:', error);
        // Return defaults on error
        return {
            silverMinROI: 20,
            silverMaxROI: 30,
            goldMinROI: 30,
            goldMaxROI: 40,
            amountThreshold: 5000
        };
    }
};

/**
 * Generate random ROI based on database settings
 */
const generateDynamicROI = async (investmentAmount) => {
    try {
        const roiRanges = await getROIRanges();
        
        let monthlyROI, packageType;
        
        if (investmentAmount < roiRanges.amountThreshold) {
            // Silver package
            monthlyROI = roiRanges.silverMinROI + Math.random() * (roiRanges.silverMaxROI - roiRanges.silverMinROI);
            packageType = 'Silver';
        } else {
            // Gold package
            monthlyROI = roiRanges.goldMinROI + Math.random() * (roiRanges.goldMaxROI - roiRanges.goldMinROI);
            packageType = 'Gold';
        }
        
        const dailyROI = monthlyROI / 30;
        
        return {
            monthlyROI: parseFloat(monthlyROI.toFixed(2)),
            dailyROI: parseFloat(dailyROI.toFixed(3)),
            packageType,
            roiRanges
        };
        
    } catch (error) {
        log.error('Error generating dynamic ROI:', error);
        // Fallback to static values
        const monthlyROI = investmentAmount < 5000 ? 25 : 35;
        const dailyROI = monthlyROI / 30;
        
        return {
            monthlyROI,
            dailyROI: parseFloat(dailyROI.toFixed(3)),
            packageType: investmentAmount < 5000 ? 'Silver' : 'Gold',
            roiRanges: null
        };
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedROISettings()
        .then((result) => {
            console.log('ROI settings seeded successfully:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Failed to seed ROI settings:', error);
            process.exit(1);
        });
}

module.exports = {
    seedROISettings,
    getROIRanges,
    generateDynamicROI
};
