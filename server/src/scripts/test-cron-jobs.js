'use strict';

const mongoose = require('mongoose');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Script to test cron jobs manually with dynamic ROI system
 * Tests both daily trading profit and level ROI processing
 */

const testCronJobs = async () => {
    try {
        log.info('Starting cron jobs test with dynamic ROI system...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState !== 1) {
            const config = require('../config/config');
            await mongoose.connect(config.databaseUrl);
            log.info('Connected to database');
        }

        console.log('\n=== TESTING DYNAMIC ROI SYSTEM FIRST ===');

        // Test dynamic ROI generation
        const { getROIRanges, generateDynamicROI } = require('../seeders/roi-settings.seeder');
        const roiRanges = await getROIRanges();

        console.log('Current ROI ranges from database:');
        console.log(`- Silver Package: ${roiRanges.silverMinROI}% - ${roiRanges.silverMaxROI}% monthly`);
        console.log(`- Gold Package: ${roiRanges.goldMinROI}% - ${roiRanges.goldMaxROI}% monthly`);
        console.log(`- Amount Threshold: $${roiRanges.amountThreshold}`);

        // Test ROI generation for different amounts
        const testAmounts = [1000, 3000, 5000, 10000];
        console.log('\nTesting ROI generation for different investment amounts:');
        for (const amount of testAmounts) {
            const roiData = await generateDynamicROI(amount);
            console.log(`$${amount}: ${roiData.packageType} → ${roiData.monthlyROI}% monthly (${roiData.dailyROI}% daily)`);
        }

        // Import cron functions
        const {
            _processDailyTradingProfit,
            _processLevelRoiIncome
        } = require('../controllers/user/cron.controller');

        console.log('\n=== TESTING DAILY TRADING PROFIT CRON ===');
        
        // Test daily trading profit processing
        const dailyProfitResult = await _processDailyTradingProfit('manual_test');
        
        console.log('\n--- Daily Trading Profit Result ---');
        console.log('Success:', dailyProfitResult.success);
        console.log('Processed Count:', dailyProfitResult.processedCount);
        console.log('Total Profit:', dailyProfitResult.totalProfit);
        console.log('Cron Execution ID:', dailyProfitResult.cronExecutionId);
        
        if (dailyProfitResult.errors) {
            console.log('Errors:', dailyProfitResult.errors.length);
        }

        console.log('\n=== TESTING LEVEL ROI INCOME CRON ===');
        
        // Test level ROI processing
        const levelRoiResult = await _processLevelRoiIncome('manual_test');
        
        console.log('\n--- Level ROI Income Result ---');
        console.log('Success:', levelRoiResult.success);
        console.log('Processed Count:', levelRoiResult.processedCount);
        console.log('Total Commission:', levelRoiResult.totalCommission);
        console.log('Cron Execution ID:', levelRoiResult.cronExecutionId);
        
        if (levelRoiResult.errors) {
            console.log('Errors:', levelRoiResult.errors.length);
        }

        console.log('\n=== CRON JOBS TEST COMPLETED ===');
        
        return {
            success: true,
            dailyProfitResult,
            levelRoiResult
        };

    } catch (error) {
        log.error('Error testing cron jobs:', error);
        console.error('Test failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log.info('Database connection closed');
        }
    }
};

// Run the test if called directly
if (require.main === module) {
    testCronJobs()
        .then((result) => {
            console.log('\n✅ Cron jobs test completed successfully!');
            console.log('Daily Profit Success:', result.dailyProfitResult.success);
            console.log('Level ROI Success:', result.levelRoiResult.success);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Cron jobs test failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    testCronJobs
};
