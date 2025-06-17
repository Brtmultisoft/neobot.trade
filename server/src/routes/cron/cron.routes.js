const Router = require('express').Router();
/**
 * All Controllers
 */
const {
    cronController
} = require('../../controllers');

/**
 * All Middlewares
 */

const {
    cronMiddleware
} = require("../../middlewares");


module.exports = () => {

    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middlerware for Handling Request Authorization
     */
    Router.use('/', cronMiddleware)

    // EXCEPTION FOR GIT PULL
    // Router.get("/restartProj", cronController.restartProj)

    // // /** CRON ROUTES */
    // Router.post("/updateTeamInvestment", cronController.updateTeamInvestment)
    // Router.post("/updateMatchingBonus", cronController.updateMatchingBonus)
    // Router.post("/updateVIPBonus", cronController.updateVIPBonus)
    // Router.post("/updateROI", cronController.roi)

    // Router.post("/assignTokens", cronController.assignTokens)
    // Router.post("/resetAssignTokens", cronController.resetAssignTokens)

    // Router.post("/withdrawCron", cronController.withdrawCron)
    Router.post("/distributeCron", cronController.distributeTokensHandler)
    Router.post("/autoFundDistribution", cronController.AutoFundDistribution)
    Router.post("/processDailyProfit", cronController.processDailyTradingProfit)
    Router.post("/resetAndProcessDailyProfit", cronController.resetAndProcessDailyProfit) // New endpoint for reset and process
    Router.post("/checkDuplicatePreventionStatus", cronController.checkDuplicatePreventionStatus) // Check duplicate prevention
    Router.post("/processLevelRoiIncome", cronController.processLevelRoiIncome)
    Router.post("/processActiveMemberRewards", cronController.processActiveMemberReward)
    Router.post("/resetDailyLoginCounters", cronController.resetDailyLoginCounters)
    Router.post("/processUserRanks", cronController.processUserRanks)
    Router.post("/processTeamRewards", cronController.processTeamRewards)

    // Quick fix endpoint for level ROI and rewards
    Router.post("/quickFix", async (req, res) => {
        try {
            console.log("Quick fix endpoint called");

            // Check API key
            if (!req.body.key || req.body.key !== process.env.APP_API_KEY) {
                return res.status(401).json({
                    status: false,
                    message: 'Invalid API key'
                });
            }

            const results = {};

            // 1. Process daily profit first
            console.log("1. Processing daily profit...");
            const dailyProfitResult = await cronController._processDailyTradingProfit('quick_fix');
            results.dailyProfit = {
                success: dailyProfitResult.success,
                processed: dailyProfitResult.processedCount,
                totalProfit: dailyProfitResult.totalProfit
            };

            // 2. Process level ROI
            console.log("2. Processing level ROI...");
            const levelROIResult = await cronController._processLevelRoiIncome('quick_fix');
            results.levelROI = {
                success: levelROIResult.success,
                processed: levelROIResult.processedCount,
                totalCommission: levelROIResult.totalCommission
            };

            // 3. Seed rewards if none exist
            console.log("3. Checking rewards...");
            const Reward = require('../../models/reward.model');
            const rewardCount = await Reward.countDocuments();

            if (rewardCount === 0) {
                console.log("No rewards found, seeding...");
                const { seedRewards } = require('../../seeders/reward.seeder');
                const rewardResult = await seedRewards();
                results.rewards = {
                    success: rewardResult.success,
                    created: rewardResult.data?.totalRewards || 0
                };
            } else {
                results.rewards = {
                    success: true,
                    existing: rewardCount
                };
            }

            return res.status(200).json({
                status: true,
                message: 'Quick fix completed',
                results: results
            });

        } catch (error) {
            console.error('Quick fix error:', error);
            return res.status(500).json({
                status: false,
                message: 'Quick fix failed',
                error: error.message
            });
        }
    })

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
}
