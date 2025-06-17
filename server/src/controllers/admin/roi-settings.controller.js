'use strict';

const Setting = require('../../models/setting.model');
const investmentPlanModel = require('../../models/investmentplan.model');
const logger = require('../../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Get all ROI settings
 */
const getROISettings = async (req, res) => {
    try {
        log.info('Fetching ROI settings with trading packages');

        // Fetch all active trading packages
        const tradingPackages = await investmentPlanModel.find({
            status: true
        }).select('name title description minAmount maxAmount').sort({ name: 1 });

        log.info(`Found ${tradingPackages.length} trading packages`);

        // Fetch all ROI and withdrawal settings
        const allSettings = await Setting.find({
            $or: [
                { name: { $regex: /_monthly_roi_(min|max)$/ } },
                { name: 'withdrawal_fee_percentage' },
                { name: 'minimum_withdrawal_amount' },
                { name: { $regex: /_amount_threshold$/ } }
            ]
        }).sort({ name: 1 });

        log.info(`Found ${allSettings.length} settings`);

        // Organize data by trading packages and general settings
        const organizedData = {
            tradingPackages: [],
            withdrawalSettings: [],
            generalSettings: [],
            rawSettings: allSettings
        };

        // Process trading packages
        tradingPackages.forEach(pkg => {
            const packageName = pkg.name || pkg.title;
            const packageKey = packageName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

            // Find min and max ROI settings for this package
            const minROISetting = allSettings.find(s => s.name === `${packageKey}_monthly_roi_min`);
            const maxROISetting = allSettings.find(s => s.name === `${packageKey}_monthly_roi_max`);

            const packageData = {
                id: pkg._id,
                name: packageName,
                key: packageKey,
                description: pkg.description,
                minAmount: pkg.minAmount,
                maxAmount: pkg.maxAmount,
                roiRange: {
                    min: {
                        value: minROISetting?.value || null,
                        settingId: minROISetting?._id || null,
                        settingName: `${packageKey}_monthly_roi_min`
                    },
                    max: {
                        value: maxROISetting?.value || null,
                        settingId: maxROISetting?._id || null,
                        settingName: `${packageKey}_monthly_roi_max`
                    }
                },
                dailyROI: {
                    min: minROISetting?.value ? (parseFloat(minROISetting.value) / 30).toFixed(3) : null,
                    max: maxROISetting?.value ? (parseFloat(maxROISetting.value) / 30).toFixed(3) : null
                }
            };

            organizedData.tradingPackages.push(packageData);
        });

        // Process withdrawal settings
        const withdrawalFee = allSettings.find(s => s.name === 'withdrawal_fee_percentage');
        const minWithdrawal = allSettings.find(s => s.name === 'minimum_withdrawal_amount');

        if (withdrawalFee) {
            organizedData.withdrawalSettings.push({
                key: 'withdrawal_fee_percentage',
                label: 'Withdrawal Fee (%)',
                value: withdrawalFee.value,
                settingId: withdrawalFee._id,
                description: 'Fee charged on all withdrawals',
                category: 'Withdrawal Settings'
            });
        }

        if (minWithdrawal) {
            organizedData.withdrawalSettings.push({
                key: 'minimum_withdrawal_amount',
                label: 'Minimum Withdrawal ($)',
                value: minWithdrawal.value,
                settingId: minWithdrawal._id,
                description: 'Minimum withdrawal amount allowed',
                category: 'Withdrawal Settings'
            });
        }

        // Process general settings (thresholds, etc.)
        const thresholdSettings = allSettings.filter(s => s.name.includes('_amount_threshold'));
        thresholdSettings.forEach(setting => {
            organizedData.generalSettings.push({
                key: setting.name,
                label: setting.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: setting.value,
                settingId: setting._id,
                description: setting.extra?.description || 'General setting',
                category: 'General Settings'
            });
        });

        return res.status(200).json({
            success: true,
            message: 'ROI settings fetched successfully',
            data: organizedData
        });

    } catch (error) {
        log.error('Error fetching ROI settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching ROI settings',
            error: error.message
        });
    }
};

/**
 * Update or create ROI setting
 */
const updateROISetting = async (req, res) => {
    try {
        const { name, value, description } = req.body;

        log.info(`Updating ROI setting: ${name} = ${value}`);

        // Validate required fields
        if (!name || value === undefined || value === null) {
            return res.status(400).json({
                success: false,
                message: 'Setting name and value are required'
            });
        }

        // Validate setting name
        const allowedSettings = [
            'silver_package_monthly_roi_min',
            'silver_package_monthly_roi_max',
            'gold_package_monthly_roi_min',
            'gold_package_monthly_roi_max',
            'silver_package_amount_threshold',
            'withdrawal_fee_percentage',
            'minimum_withdrawal_amount'
        ];

        if (!allowedSettings.includes(name)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid setting name'
            });
        }

        // Validate value ranges
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return res.status(400).json({
                success: false,
                message: 'Setting value must be a valid number'
            });
        }

        // Validate specific ranges
        if (name.includes('roi')) {
            if (numValue < 0.01 || numValue > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'ROI value must be between 0.01% and 100%'
                });
            }
        } else if (name.includes('amount_threshold')) {
            if (numValue < 100 || numValue > 100000) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount threshold must be between $100 and $100,000'
                });
            }
        } else if (name === 'withdrawal_fee_percentage') {
            if (numValue < 0 || numValue > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Withdrawal fee must be between 0% and 50%'
                });
            }
        } else if (name === 'minimum_withdrawal_amount') {
            if (numValue < 1 || numValue > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum withdrawal amount must be between $1 and $1,000'
                });
            }
        }

        // Additional validation for ROI ranges
        if (name === 'silver_package_monthly_roi_max') {
            const minSetting = await Setting.findOne({ name: 'silver_package_monthly_roi_min' });
            if (minSetting && parseFloat(minSetting.value) >= numValue) {
                return res.status(400).json({
                    success: false,
                    message: 'Silver max ROI must be greater than min ROI'
                });
            }
        }

        if (name === 'gold_package_monthly_roi_max') {
            const minSetting = await Setting.findOne({ name: 'gold_package_monthly_roi_min' });
            if (minSetting && parseFloat(minSetting.value) >= numValue) {
                return res.status(400).json({
                    success: false,
                    message: 'Gold max ROI must be greater than min ROI'
                });
            }
        }

        // Update or create setting
        const updatedSetting = await Setting.findOneAndUpdate(
            { name },
            {
                $set: {
                    value: value.toString(),
                    extra: {
                        description: description || `ROI setting: ${name}`,
                        type: 'number',
                        category: 'roi_settings',
                        updated_by: req.user?.id || 'admin',
                        updated_at: new Date()
                    },
                    status: true,
                    updated_at: new Date()
                }
            },
            { 
                upsert: true, 
                new: true,
                runValidators: true
            }
        );

        log.info(`ROI setting updated successfully: ${name} = ${value}`);

        // Log the change for audit
        log.info(`Admin ${req.user?.id || 'unknown'} updated ROI setting ${name} to ${value}`);

        return res.status(200).json({
            success: true,
            message: 'ROI setting updated successfully',
            data: updatedSetting
        });

    } catch (error) {
        log.error('Error updating ROI setting:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating ROI setting',
            error: error.message
        });
    }
};

/**
 * Get trading packages only
 */
const getTradingPackages = async (req, res) => {
    try {
        log.info('Fetching trading packages for ROI settings');

        const tradingPackages = await investmentPlanModel.find({
            status: true
        }).select('name title description minAmount maxAmount').sort({ name: 1 });

        const packagesData = tradingPackages.map(pkg => ({
            id: pkg._id,
            name: pkg.name || pkg.title,
            key: (pkg.name || pkg.title).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            description: pkg.description,
            minAmount: pkg.minAmount,
            maxAmount: pkg.maxAmount
        }));

        return res.status(200).json({
            success: true,
            message: 'Trading packages fetched successfully',
            data: packagesData
        });

    } catch (error) {
        log.error('Error fetching trading packages:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching trading packages',
            error: error.message
        });
    }
};

/**
 * Get ROI ranges summary
 */
const getROIRangesSummary = async (req, res) => {
    try {
        log.info('Fetching ROI ranges summary');

        const { getROIRanges } = require('../../seeders/roi-settings.seeder');
        const roiRanges = await getROIRanges();

        const summary = {
            silverPackage: {
                monthlyMin: roiRanges.silverMinROI,
                monthlyMax: roiRanges.silverMaxROI,
                dailyMin: (roiRanges.silverMinROI / 30).toFixed(3),
                dailyMax: (roiRanges.silverMaxROI / 30).toFixed(3)
            },
            goldPackage: {
                monthlyMin: roiRanges.goldMinROI,
                monthlyMax: roiRanges.goldMaxROI,
                dailyMin: (roiRanges.goldMinROI / 30).toFixed(3),
                dailyMax: (roiRanges.goldMaxROI / 30).toFixed(3)
            },
            amountThreshold: roiRanges.amountThreshold,
            withdrawalFeePercentage: roiRanges.withdrawalFeePercentage,
            minimumWithdrawalAmount: roiRanges.minimumWithdrawalAmount
        };

        return res.status(200).json({
            success: true,
            message: 'ROI ranges summary fetched successfully',
            data: summary
        });

    } catch (error) {
        log.error('Error fetching ROI ranges summary:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching ROI ranges summary',
            error: error.message
        });
    }
};

/**
 * Test ROI generation
 */
const testROIGeneration = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({
                success: false,
                message: 'Valid investment amount is required'
            });
        }

        log.info(`Testing ROI generation for amount: $${amount}`);

        const { generateDynamicROI } = require('../../seeders/roi-settings.seeder');
        const roiData = await generateDynamicROI(parseFloat(amount));

        return res.status(200).json({
            success: true,
            message: 'ROI generation test completed',
            data: {
                investmentAmount: parseFloat(amount),
                packageType: roiData.packageType,
                monthlyROI: roiData.monthlyROI,
                dailyROI: roiData.dailyROI,
                roiRanges: roiData.roiRanges
            }
        });

    } catch (error) {
        log.error('Error testing ROI generation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while testing ROI generation',
            error: error.message
        });
    }
};

/**
 * Calculate withdrawal fee and net amount
 */
const calculateWithdrawalFee = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({
                success: false,
                message: 'Valid withdrawal amount is required'
            });
        }

        log.info(`Calculating withdrawal fee for amount: $${amount}`);

        const withdrawalService = require('../../services/withdrawal-settings.service');
        const calculation = await withdrawalService.getWithdrawalSummary(parseFloat(amount));

        return res.status(200).json({
            success: true,
            message: 'Withdrawal fee calculation completed',
            data: calculation
        });

    } catch (error) {
        log.error('Error calculating withdrawal fee:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while calculating withdrawal fee',
            error: error.message
        });
    }
};

module.exports = {
    getROISettings,
    updateROISetting,
    getTradingPackages,
    getROIRangesSummary,
    testROIGeneration,
    calculateWithdrawalFee
};
