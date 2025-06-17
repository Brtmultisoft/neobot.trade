'use strict';

const mongoose = require('mongoose');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Complete setup script for dynamic ROI system
 * 1. Seeds ROI settings to database
 * 2. Updates trading packages with dynamic ROI values
 * 3. Tests the system
 */

const setupDynamicROISystem = async () => {
    try {
        log.info('Starting complete dynamic ROI system setup...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState !== 1) {
            const config = require('../config/config');
            await mongoose.connect(config.databaseUrl);
            log.info('Connected to database');
        }

        console.log('\n=== STEP 1: SEEDING ROI SETTINGS ===');
        
        // Import and run ROI settings seeder
        const { seedROISettings, getROIRanges } = require('../seeders/roi-settings.seeder');
        const seedResult = await seedROISettings();
        console.log('ROI settings seeded:', seedResult);

        console.log('\n=== STEP 2: VERIFYING ROI SETTINGS ===');
        
        // Verify settings were created
        const roiRanges = await getROIRanges();
        console.log('Current ROI ranges from database:');
        console.log(`- Silver Package: ${roiRanges.silverMinROI}% - ${roiRanges.silverMaxROI}% monthly`);
        console.log(`- Gold Package: ${roiRanges.goldMinROI}% - ${roiRanges.goldMaxROI}% monthly`);
        console.log(`- Amount Threshold: $${roiRanges.amountThreshold}`);

        console.log('\n=== STEP 3: UPDATING TRADING PACKAGES ===');
        
        // Import and run trading package updates
        const { updateTradingPackageROI } = require('./update-trading-package-roi');
        const updateResult = await updateTradingPackageROI();
        console.log('Trading packages updated:', updateResult);

        console.log('\n=== STEP 4: TESTING DYNAMIC ROI GENERATION ===');
        
        // Test dynamic ROI generation
        const { generateDynamicROI } = require('../seeders/roi-settings.seeder');
        
        // Test Silver package (amount < threshold)
        const silverTest = await generateDynamicROI(2500);
        console.log(`Silver test ($2500): ${silverTest.monthlyROI}% monthly → ${silverTest.dailyROI}% daily`);
        
        // Test Gold package (amount >= threshold)
        const goldTest = await generateDynamicROI(7500);
        console.log(`Gold test ($7500): ${goldTest.monthlyROI}% monthly → ${goldTest.dailyROI}% daily`);

        console.log('\n=== STEP 5: VERIFYING TRADING PACKAGES ===');
        
        // Check final trading packages
        const TradingPackage = require('../models/tradingpackage.model');
        const packages = await TradingPackage.find({
            status: true,
            is_deleted: { $ne: true }
        }).select('name daily_trading_roi extra');

        console.log('Final trading packages:');
        packages.forEach(pkg => {
            const monthlyROI = pkg.extra?.monthly_roi || (pkg.daily_trading_roi * 30);
            console.log(`- ${pkg.name}: ${pkg.daily_trading_roi}% daily (${monthlyROI.toFixed(2)}% monthly)`);
        });

        console.log('\n=== STEP 6: TESTING CRON FALLBACK LOGIC ===');
        
        // Test the cron fallback logic
        console.log('Testing cron fallback logic with different investment amounts:');
        
        const testAmounts = [1000, 3000, 5000, 10000];
        for (const amount of testAmounts) {
            const roiData = await generateDynamicROI(amount);
            console.log(`Investment $${amount}: ${roiData.packageType} package, ${roiData.monthlyROI}% monthly, ${roiData.dailyROI}% daily`);
        }

        console.log('\n=== DYNAMIC ROI SYSTEM SETUP COMPLETED ===');
        
        return {
            success: true,
            seedResult,
            updateResult,
            roiRanges,
            testResults: {
                silverTest,
                goldTest
            }
        };

    } catch (error) {
        log.error('Error setting up dynamic ROI system:', error);
        console.error('Setup failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log.info('Database connection closed');
        }
    }
};

// Run the setup if called directly
if (require.main === module) {
    setupDynamicROISystem()
        .then((result) => {
            console.log('\n✅ Dynamic ROI system setup completed successfully!');
            console.log('System is now ready to use database-driven dynamic ROI values.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Dynamic ROI system setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    setupDynamicROISystem
};
