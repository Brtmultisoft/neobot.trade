'use strict';

const mongoose = require('mongoose');
const TradingPackage = require('../models/tradingpackage.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Import ROI settings helper
 */
const { getROIRanges, generateDynamicROI } = require('../seeders/roi-settings.seeder');

/**
 * Script to update existing trading packages with new dynamic ROI values from database settings
 * Uses database settings for min/max ROI ranges instead of static values
 */

const updateTradingPackageROI = async () => {
    try {
        log.info('Starting trading package ROI update with database-driven dynamic values...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState !== 1) {
            const config = require('../config/config');
            await mongoose.connect(config.databaseUrl);
            log.info('Connected to database');
        }

        // Get ROI ranges from database
        const roiRanges = await getROIRanges();
        log.info('ROI ranges from database:', roiRanges);

        // Generate random ROI values for Silver package
        const silverMonthlyROI = roiRanges.silverMinROI + Math.random() * (roiRanges.silverMaxROI - roiRanges.silverMinROI);
        const silverDailyROI = silverMonthlyROI / 30;

        // Generate random ROI values for Gold package
        const goldMonthlyROI = roiRanges.goldMinROI + Math.random() * (roiRanges.goldMaxROI - roiRanges.goldMinROI);
        const goldDailyROI = goldMonthlyROI / 30;

        log.info(`Generated Silver Package: ${silverMonthlyROI.toFixed(2)}% monthly (${silverDailyROI.toFixed(3)}% daily)`);
        log.info(`Generated Gold Package: ${goldMonthlyROI.toFixed(2)}% monthly (${goldDailyROI.toFixed(3)}% daily)`);

        // Update Silver Package
        const silverUpdate = await TradingPackage.findOneAndUpdate(
            {
                name: 'Silver Package',
                is_deleted: { $ne: true }
            },
            {
                $set: {
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
                    'extra.monthly_roi': parseFloat(silverMonthlyROI.toFixed(2)),
                    updated_at: new Date()
                }
            },
            { new: true }
        );

        if (silverUpdate) {
            log.info(`Silver Package updated successfully: ${silverUpdate.daily_trading_roi}% daily ROI (${silverMonthlyROI.toFixed(2)}% monthly)`);
        } else {
            log.warn('Silver Package not found or already deleted');
        }

        // Update Gold Package
        const goldUpdate = await TradingPackage.findOneAndUpdate(
            {
                name: 'Gold Package',
                is_deleted: { $ne: true }
            },
            {
                $set: {
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
                    'extra.monthly_roi': parseFloat(goldMonthlyROI.toFixed(2)),
                    updated_at: new Date()
                }
            },
            { new: true }
        );

        if (goldUpdate) {
            log.info(`Gold Package updated successfully: ${goldUpdate.daily_trading_roi}% daily ROI (${goldMonthlyROI.toFixed(2)}% monthly)`);
        } else {
            log.warn('Gold Package not found or already deleted');
        }

        // Get all updated packages for verification
        const allPackages = await TradingPackage.find({
            is_deleted: { $ne: true },
            status: true
        }).select('name daily_trading_roi trading_amount_from trading_amount_to');

        log.info('Current trading packages after update:');
        allPackages.forEach(pkg => {
            log.info(`- ${pkg.name}: ${pkg.daily_trading_roi}% ROI (Amount: $${pkg.trading_amount_from} - ${pkg.trading_amount_to === 999999999 ? 'Unlimited' : '$' + pkg.trading_amount_to})`);
        });

        log.info('Trading package ROI update completed successfully!');
        
        return {
            success: true,
            silverUpdated: !!silverUpdate,
            goldUpdated: !!goldUpdate,
            totalPackages: allPackages.length
        };

    } catch (error) {
        log.error('Error updating trading package ROI:', error);
        throw error;
    }
};

// Run the script if called directly
if (require.main === module) {
    updateTradingPackageROI()
        .then((result) => {
            console.log('Update result:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Update failed:', error);
            process.exit(1);
        });
}

module.exports = {
    updateTradingPackageROI
};
