'use strict';
const TradingPackage = require('../models/tradingpackage.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Seed default trading packages for neobot.trade
 */
const seedDefaultTradingPackages = async () => {
    try {
        // Check if trading packages already exist
        const existingPackages = await TradingPackage.countDocuments();

        if (existingPackages === 0) {
            log.info('Creating default trading packages for neobot.trade');

            // Define the default trading packages
            const defaultPackages = [
                {
                    name: 'Silver Package',
                    package_number: 1,
                    trading_amount_from: 100,
                    trading_amount_to: 4999,
                    daily_trading_roi: 1.0, // 1% Daily Trading ROI
                    description: 'Entry-level trading package with competitive daily returns',
                    features: [
                        '1% Daily Trading ROI',
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
                        recommended: false
                    }
                },
                {
                    name: 'Gold Package',
                    package_number: 2,
                    trading_amount_from: 5000,
                    trading_amount_to: 999999999, // Very large number to represent unlimited
                    daily_trading_roi: 1.15, // 1.15% Daily Trading ROI
                    description: 'Premium trading package with enhanced returns and unlimited investment',
                    features: [
                        '1.15% Daily Trading ROI',
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
                        recommended: true
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

        // Update Silver Package
        await TradingPackage.findOneAndUpdate(
            { name: 'Silver Package' },
            {
                $set: {
                    trading_amount_from: 100,
                    trading_amount_to: 4999,
                    daily_trading_roi: 1.0,
                    description: 'Entry-level trading package with competitive daily returns',
                    features: [
                        '1% Daily Trading ROI',
                        'Trading amount: $100 - $4,999',
                        'Daily profit distribution',
                        'Basic trading signals',
                        'Email support'
                    ],
                    is_unlimited: false,
                    sort_order: 1
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
                    daily_trading_roi: 1.15,
                    description: 'Premium trading package with enhanced returns and unlimited investment',
                    features: [
                        '1.15% Daily Trading ROI',
                        'Trading amount: $5,000 to Unlimited',
                        'Daily profit distribution',
                        'Advanced trading signals',
                        'Priority support',
                        'Dedicated account manager',
                        'Market analysis reports'
                    ],
                    is_unlimited: true,
                    sort_order: 2
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
