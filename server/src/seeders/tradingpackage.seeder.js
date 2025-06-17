'use strict';
const TradingPackage = require('../models/tradingpackage.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Import ROI settings helper
 */
const { getROIRanges, generateDynamicROI } = require('./roi-settings.seeder');

/**
 * Generate random ROI values from database settings
 */
const generateRandomROI = async (packageType) => {
    try {
        const roiRanges = await getROIRanges();

        if (packageType === 'silver') {
            return roiRanges.silverMinROI + Math.random() * (roiRanges.silverMaxROI - roiRanges.silverMinROI);
        } else {
            return roiRanges.goldMinROI + Math.random() * (roiRanges.goldMaxROI - roiRanges.goldMinROI);
        }
    } catch (error) {
        log.error('Error generating random ROI from database:', error);
        // Fallback to static values
        return packageType === 'silver' ? (20 + Math.random() * 10) : (30 + Math.random() * 10);
    }
};

/**
 * Convert monthly ROI to daily ROI
 */
const monthlyToDaily = (monthlyROI) => {
    return monthlyROI / 30;
};

/**
 * Seed default trading packages for neobot.trade
 */
const seedDefaultTradingPackages = async () => {
    try {
        // Check if trading packages already exist
        const existingPackages = await TradingPackage.countDocuments();

        if (existingPackages === 0) {
            log.info('Creating default trading packages for neobot.trade');

            // Generate random monthly ROI values from database settings
            const silverMonthlyROI = await generateRandomROI('silver'); // Random from DB settings
            const goldMonthlyROI = await generateRandomROI('gold');     // Random from DB settings

            // Convert to daily ROI
            const silverDailyROI = monthlyToDaily(silverMonthlyROI);
            const goldDailyROI = monthlyToDaily(goldMonthlyROI);

            log.info(`Generated Silver Package: ${silverMonthlyROI.toFixed(2)}% monthly (${silverDailyROI.toFixed(3)}% daily)`);
            log.info(`Generated Gold Package: ${goldMonthlyROI.toFixed(2)}% monthly (${goldDailyROI.toFixed(3)}% daily)`);

            // Define the default trading packages
            const defaultPackages = [
                {
                    name: 'Silver Package',
                    package_number: 1,
                    trading_amount_from: 100,
                    trading_amount_to: 4999,
                    daily_trading_roi: parseFloat(silverDailyROI.toFixed(3)), // Random daily ROI from monthly 20-30%
                    description: `Entry-level trading package with ${silverMonthlyROI.toFixed(2)}% monthly returns`,
                    features: [
                        `${silverMonthlyROI.toFixed(2)}% Monthly Trading ROI`,
                        `${silverDailyROI.toFixed(3)}% Daily Trading ROI`,
                        'Trading amount: $100 - $4,999',
                        'Daily profit distribution',
                        'Basic trading signals',
                        'Email support'
                    ],
                    is_unlimited: false,
                    status: true,
                    sort_order: 1,
                    extra: {
                        color: '#C0C0C0', // Silver color
                        icon: 'silver-medal',
                        recommended: false,
                        monthly_roi: parseFloat(silverMonthlyROI.toFixed(2))
                    }
                },
                {
                    name: 'Gold Package',
                    package_number: 2,
                    trading_amount_from: 5000,
                    trading_amount_to: 999999999, // Very large number to represent unlimited
                    daily_trading_roi: parseFloat(goldDailyROI.toFixed(3)), // Random daily ROI from monthly 30-40%
                    description: `Premium trading package with ${goldMonthlyROI.toFixed(2)}% monthly returns`,
                    features: [
                        `${goldMonthlyROI.toFixed(2)}% Monthly Trading ROI`,
                        `${goldDailyROI.toFixed(3)}% Daily Trading ROI`,
                        'Trading amount: $5,000 to Unlimited',
                        'Daily profit distribution',
                        'Advanced trading signals',
                        'Priority support',
                        'Dedicated account manager',
                        'Market analysis reports'
                    ],
                    is_unlimited: true,
                    status: true,
                    sort_order: 2,
                    extra: {
                        color: '#FFD700', // Gold color
                        icon: 'gold-medal',
                        recommended: true,
                        monthly_roi: parseFloat(goldMonthlyROI.toFixed(2))
                    }
                }
            ];

            // Create the trading packages
            const createdPackages = await TradingPackage.insertMany(defaultPackages);
            
            log.info(`Successfully created ${createdPackages.length} default trading packages:`);
            createdPackages.forEach(pkg => {
                log.info(`- ${pkg.name}: $${pkg.trading_amount_from} - ${pkg.is_unlimited ? 'Unlimited' : '$' + pkg.trading_amount_to} (${pkg.daily_trading_roi}% ROI)`);
            });

        } else {
            log.info(`Trading packages already exist (${existingPackages} packages found)`);
        }
    } catch (error) {
        log.error('Error seeding default trading packages:', error);
        throw error;
    }
};

/**
 * Update existing trading packages with new data (if needed)
 */
const updateTradingPackages = async () => {
    try {
        log.info('Checking for trading package updates...');

        // Generate new random ROI values for updates from database settings
        const silverMonthlyROI = await generateRandomROI('silver'); // Random from DB settings
        const goldMonthlyROI = await generateRandomROI('gold');     // Random from DB settings

        // Convert to daily ROI
        const silverDailyROI = monthlyToDaily(silverMonthlyROI);
        const goldDailyROI = monthlyToDaily(goldMonthlyROI);

        log.info(`Updating Silver Package: ${silverMonthlyROI.toFixed(2)}% monthly (${silverDailyROI.toFixed(3)}% daily)`);
        log.info(`Updating Gold Package: ${goldMonthlyROI.toFixed(2)}% monthly (${goldDailyROI.toFixed(3)}% daily)`);

        // Update Silver Package
        await TradingPackage.findOneAndUpdate(
            { name: 'Silver Package' },
            {
                $set: {
                    trading_amount_from: 100,
                    trading_amount_to: 4999,
                    daily_trading_roi: parseFloat(silverDailyROI.toFixed(3)),
                    description: `Entry-level trading package with ${silverMonthlyROI.toFixed(2)}% monthly returns`,
                    features: [
                        `${silverMonthlyROI.toFixed(2)}% Monthly Trading ROI`,
                        `${silverDailyROI.toFixed(3)}% Daily Trading ROI`,
                        'Trading amount: $100 - $4,999',
                        'Daily profit distribution',
                        'Basic trading signals',
                        'Email support'
                    ],
                    is_unlimited: false,
                    sort_order: 1,
                    'extra.monthly_roi': parseFloat(silverMonthlyROI.toFixed(2))
                }
            },
            { upsert: true }
        );

        // Update Gold Package
        await TradingPackage.findOneAndUpdate(
            { name: 'Gold Package' },
            {
                $set: {
                    trading_amount_from: 5000,
                    trading_amount_to: 999999999,
                    daily_trading_roi: parseFloat(goldDailyROI.toFixed(3)),
                    description: `Premium trading package with ${goldMonthlyROI.toFixed(2)}% monthly returns`,
                    features: [
                        `${goldMonthlyROI.toFixed(2)}% Monthly Trading ROI`,
                        `${goldDailyROI.toFixed(3)}% Daily Trading ROI`,
                        'Trading amount: $5,000 to Unlimited',
                        'Daily profit distribution',
                        'Advanced trading signals',
                        'Priority support',
                        'Dedicated account manager',
                        'Market analysis reports'
                    ],
                    is_unlimited: true,
                    sort_order: 2,
                    'extra.monthly_roi': parseFloat(goldMonthlyROI.toFixed(2))
                }
            },
            { upsert: true }
        );

        log.info('Trading packages updated successfully');
    } catch (error) {
        log.error('Error updating trading packages:', error);
        throw error;
    }
};

module.exports = {
    seedDefaultTradingPackages,
    updateTradingPackages
};
