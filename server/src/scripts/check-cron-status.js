'use strict';

const mongoose = require('mongoose');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Script to check the current status of cron jobs and related data
 */

const checkCronStatus = async () => {
    try {
        log.info('Checking cron status and related data...');

        // Connect to database if not already connected
        if (mongoose.connection.readyState !== 1) {
            const config = require('../config/config');
            await mongoose.connect(config.databaseUrl);
            log.info('Connected to database');
        }

        // Import required models and handlers
        const TradingPackage = require('../models/tradingpackage.model');
        const { investmentDbHandler, incomeDbHandler, cronExecutionDbHandler } = require('../services/db');

        console.log('\n=== TRADING PACKAGES STATUS ===');
        
        // Check trading packages
        const tradingPackages = await TradingPackage.find({
            status: true,
            is_deleted: { $ne: true }
        }).select('name daily_trading_roi trading_amount_from trading_amount_to extra');

        console.log(`Found ${tradingPackages.length} active trading packages:`);
        tradingPackages.forEach(pkg => {
            const monthlyROI = pkg.extra?.monthly_roi || (pkg.daily_trading_roi * 30);
            console.log(`- ${pkg.name}: ${pkg.daily_trading_roi}% daily (${monthlyROI.toFixed(2)}% monthly)`);
            console.log(`  Amount range: $${pkg.trading_amount_from} - ${pkg.trading_amount_to === 999999999 ? 'Unlimited' : '$' + pkg.trading_amount_to}`);
        });

        console.log('\n=== ACTIVE INVESTMENTS STATUS ===');
        
        // Check active investments
        const activeInvestments = await investmentDbHandler.getByQuery({
            status: 'active'
        });

        console.log(`Found ${activeInvestments.length} active investments`);
        
        if (activeInvestments.length > 0) {
            const totalInvestmentAmount = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
            console.log(`Total active investment amount: $${totalInvestmentAmount.toFixed(2)}`);
            
            // Check investments by amount ranges
            const silverInvestments = activeInvestments.filter(inv => inv.amount < 5000);
            const goldInvestments = activeInvestments.filter(inv => inv.amount >= 5000);
            
            console.log(`Silver range investments (<$5000): ${silverInvestments.length}`);
            console.log(`Gold range investments (≥$5000): ${goldInvestments.length}`);
        }

        console.log('\n=== TODAY\'S INCOME STATUS ===');
        
        // Check today's income records
        const today = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const todayIST = new Date(today.getTime() + istOffset);
        todayIST.setHours(0, 0, 0, 0);
        const tomorrowIST = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);

        const todaysIncomes = await incomeDbHandler.getByQuery({
            created_at: {
                $gte: todayIST,
                $lt: tomorrowIST
            }
        });

        console.log(`Found ${todaysIncomes.length} income records for today`);
        
        if (todaysIncomes.length > 0) {
            const dailyProfits = todaysIncomes.filter(inc => inc.type === 'daily_profit');
            const levelIncomes = todaysIncomes.filter(inc => inc.type === 'level_income');
            
            console.log(`- Daily profits: ${dailyProfits.length}`);
            console.log(`- Level incomes: ${levelIncomes.length}`);
            
            const totalDailyProfit = dailyProfits.reduce((sum, inc) => sum + inc.amount, 0);
            const totalLevelIncome = levelIncomes.reduce((sum, inc) => sum + inc.amount, 0);
            
            console.log(`- Total daily profit: $${totalDailyProfit.toFixed(2)}`);
            console.log(`- Total level income: $${totalLevelIncome.toFixed(2)}`);
        }

        console.log('\n=== RECENT CRON EXECUTIONS ===');
        
        // Check recent cron executions
        const recentCrons = await cronExecutionDbHandler.getByQuery(
            {},
            { sort: { created_at: -1 }, limit: 10 }
        );

        console.log(`Found ${recentCrons.length} recent cron executions:`);
        recentCrons.forEach(cron => {
            const duration = cron.duration_ms ? `${(cron.duration_ms / 1000).toFixed(2)}s` : 'N/A';
            console.log(`- ${cron.cron_name}: ${cron.status} (${duration}) - ${new Date(cron.created_at).toLocaleString()}`);
            if (cron.processed_count !== undefined) {
                console.log(`  Processed: ${cron.processed_count}, Amount: $${(cron.total_amount || 0).toFixed(2)}`);
            }
        });

        console.log('\n=== ENVIRONMENT STATUS ===');
        console.log(`CRON_STATUS: ${process.env.CRON_STATUS}`);
        console.log(`APP_LIVE: ${process.env.APP_LIVE}`);
        console.log(`Current time: ${new Date().toLocaleString()}`);
        console.log(`IST time: ${new Date(Date.now() + istOffset).toLocaleString()}`);

        console.log('\n=== STATUS CHECK COMPLETED ===');
        
        return {
            success: true,
            tradingPackages: tradingPackages.length,
            activeInvestments: activeInvestments.length,
            todaysIncomes: todaysIncomes.length,
            recentCrons: recentCrons.length
        };

    } catch (error) {
        log.error('Error checking cron status:', error);
        console.error('Status check failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log.info('Database connection closed');
        }
    }
};

// Run the check if called directly
if (require.main === module) {
    checkCronStatus()
        .then((result) => {
            console.log('\n✅ Status check completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Status check failed:', error.message);
            process.exit(1);
        });
}

module.exports = {
    checkCronStatus
};
