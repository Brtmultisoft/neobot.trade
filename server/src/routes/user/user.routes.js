const Router = require('express').Router();
/**
 * All Controllers
 */
const {
    userAuthController,
    userInfoController,
    userController,
    user2FAController,
    otplessController,
    dualVerificationController,
    userSupportController,
    userDepositController,
    userFundTransferController,
    userIncomeController,
    userInvestmentController,
    userInvestmentPlanController,
    userMessageController,
    userSettingController,
    userWithdrawalController,
    userRankController,
    userTeamRewardController,
    userTradeActivationController,
    userTradingPackageController
} = require('../../controllers');

// Import own_pay functions
const {
    generateNewWallet,
    startMonitoring,
    savewallet
} = require('../../own_pay/own_pay');

/**
 * All Middlewares
 */

const {
    userAuthenticateMiddleware,
    verificationMiddleware,
    validationMiddleware,
    user2FaMiddleware
} = require("../../middlewares");

/**
 * Validations
 */

const {
    userAuthValidation,
    userInfoValidation,
    userValidation,
    twoFaValidation,
    dualVerificationValidation,
    supportValidation,
    depositValidation,
    fundDeductValidation,
    fundTransferValidation,
    incomeValidation,
    investmentValidation,
    investmentPlanValidation,
    messageValidation,
    withdrawalValidation,
    settingValidation
} = require("../../validations");

const multerService = require('../../services/multer');
const RewardMaster = require('../../models/reward.master.model');

module.exports = () => {

    /***************************
     * UPLOAD FILE ROUTES
     ***************************/

    Router.post('/user/upload', multerService.uploadFile('file').single('file'), (req, res) => {
        return res.send(req.file.location);
    });

    /***************************
     * START UNAUTHORIZED ROUTES
     ***************************/
    /*
     **Login and Signup Route
     */
    Router.post(
        '/check-address',
        validationMiddleware(userAuthValidation.checkAddress, 'body'),
        userAuthController.checkAddress
    );
    Router.post(
        '/user/login',
        validationMiddleware(userAuthValidation.login, 'body'),
        userAuthController.login
    );

    Router.post(
        '/user/login/request',
        validationMiddleware(userAuthValidation.userLoginRequest, 'body'),
        userAuthController.userLoginRequest
    );

    Router.post(
        '/user/login_step_2',
        [user2FaMiddleware, validationMiddleware(userAuthValidation.loginStep2, 'body')],
        userAuthController.loginStep2
    );

    Router.post(
        '/user/signup',
        validationMiddleware(userAuthValidation.signup, 'body'),
        userAuthController.signup
    );

    Router.post(
        '/user/signup-with-verification',
        validationMiddleware(userAuthValidation.signup, 'body'),
        userAuthController.signupWithVerification
    );
    Router.post(
        '/user/checkReferID',
        validationMiddleware(userAuthValidation.checkReferID, 'body'),
        userAuthController.checkReferID
    );
    Router.get(
        '/user/get-default-sponsor',
        userAuthController.getDefaultSponsor
    );
    Router.post(
        '/user/forgot/password',
        validationMiddleware(userAuthValidation.forgotPassword, 'body'),
        userAuthController.forgotPassword
    );
    Router.post(
        '/user/reset/password', [
        validationMiddleware(userAuthValidation.resetPassword, 'body'),
    ],
        userAuthController.resetPassword
    );

    // New OTP-based password reset route
    Router.post(
        '/user/reset/password-with-otp',
        userAuthController.resetPasswordWithOTP
    );

    // Password reset with already verified OTP (no re-verification)
    Router.post(
        '/user/reset/password-with-verified-otp',
        userAuthController.resetPasswordWithVerifiedOTP
    );

    Router.post(
        '/user/reset/password-with-verified-mobile-otp',
        userAuthController.resetPasswordWithVerifiedMobileOTP
    );

    // New 2FA OTP verification route (after login)
    Router.post(
        '/user/verify-2fa-otp',
        userAuthController.verify2FAOTP
    );

    // OTP verification routes for forgot password (without resetting password)
    Router.post(
        '/user/verify/forgot-password-otp',
        userAuthController.verifyForgotPasswordOTP
    );

    Router.post(
        '/user/verify/forgot-password-mobile-otp',
        userAuthController.verifyForgotPasswordMobileOTP
    );
    /**
     * Email verification Route
     */
    Router.get(
        '/email/u/verification', [
        validationMiddleware(userAuthValidation.verifyEmail, 'query'),
        verificationMiddleware,
    ],
        userAuthController.verifyEmail
    );

    Router.post(
        '/reg/email/u/verification',
        validationMiddleware(userAuthValidation.resendEmailVerification, 'body'),
        userAuthController.resendEmailVerification
    );

    /**
     * OTPless Authentication Routes
     */
    Router.post(
        '/user/otpless/send-registration-otp',
        otplessController.sendRegistrationOTP
    );

    Router.post(
        '/user/otpless/verify-registration-otp',
        otplessController.verifyRegistrationOTP
    );

    Router.post(
        '/user/otpless/send-login-otp',
        otplessController.sendLoginOTP
    );

    Router.post(
        '/user/otpless/verify-login-otp',
        otplessController.verifyLoginOTP
    );

    Router.post(
        '/user/otpless/send-2fa-otp',
        otplessController.send2FAOTP
    );

    Router.post(
        '/user/otpless/verify-2fa-otp',
        otplessController.verify2FAOTP
    );

    /**
     * Dual Verification Routes (Email + Mobile) - PUBLIC ROUTES
     */
    Router.post(
        '/user/dual-verification/send-registration-otps',
        validationMiddleware(dualVerificationValidation.sendRegistrationOTPs, 'body'),
        dualVerificationController.sendRegistrationOTPs
    );

    Router.post(
        '/user/dual-verification/verify-registration-otps',
        validationMiddleware(dualVerificationValidation.verifyRegistrationOTPs, 'body'),
        dualVerificationController.verifyRegistrationOTPs
    );

    Router.post(
        '/user/dual-verification/register-without-otp',
        dualVerificationController.registerWithoutOTP
    );

    /**
     * Individual Mobile OTP Routes - PUBLIC ROUTES
     */
    Router.post(
        '/user/otpless/send-mobile-registration-otp',
        validationMiddleware(dualVerificationValidation.sendMobileOTP, 'body'),
        otplessController.sendRegistrationMobileOTP
    );

    Router.post(
        '/user/otpless/verify-mobile-registration-otp',
        validationMiddleware(dualVerificationValidation.verifyMobileOTP, 'body'),
        otplessController.verifyRegistrationMobileOTP
    );

    /**
     * Mobile Forgot Password Routes - PUBLIC ROUTES
     */
    Router.post(
        '/user/forgot/password-mobile',
        validationMiddleware(dualVerificationValidation.sendMobileForgotPasswordOTP, 'body'),
        userAuthController.forgotPasswordMobile
    );

    Router.post(
        '/user/reset/password-with-mobile-otp',
        validationMiddleware(dualVerificationValidation.resetPasswordWithMobileOTP, 'body'),
        userAuthController.resetPasswordWithMobileOTP
    );

    // Test endpoint for OTP service
    Router.post(
        '/user/otp/test-send',
        async (req, res) => {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.json({ success: false, error: 'Email is required' });
                }

                console.log('Testing OTP send for email:', email);

                const otplessService = require('../../services/otpless.service');
                const result = await otplessService.sendRegistrationOTP(email);

                console.log('OTP send result:', result);

                return res.json({
                    success: true,
                    message: 'OTP test completed',
                    result: result
                });
            } catch (error) {
                console.error('OTP test error:', error);
                return res.json({
                    success: false,
                    error: error.message,
                    details: error.stack
                });
            }
        }
    );

    // Test endpoint for OTP verification
    Router.post(
        '/user/otp/test-verify',
        async (req, res) => {
            try {
                const { otp, requestId } = req.body;
                if (!otp || !requestId) {
                    return res.json({ success: false, error: 'OTP and requestId are required' });
                }

                console.log('Testing OTP verification:', { otp, requestId });

                const otplessService = require('../../services/otpless.service');
                const result = await otplessService.verifyRegistrationOTP(otp, requestId);

                console.log('OTP verification result:', result);

                return res.json({
                    success: true,
                    message: 'OTP verification test completed',
                    result: result
                });
            } catch (error) {
                console.error('OTP verification test error:', error);
                return res.json({
                    success: false,
                    error: error.message,
                    details: error.stack
                });
            }
        }
    );

    /**
     * Test Route (Public - No Authentication Required)
     */
    Router.get('/test-public', (req, res) => {
        res.json({
            status: true,
            message: 'Public route working!',
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Trading Package Routes (Public - No Authentication Required)
     * These routes are for viewing and calculating packages only
     */
    Router.get('/user/trading-packages', userTradingPackageController.getAllTradingPackages);
    Router.get('/user/trading-packages/:id', userTradingPackageController.getTradingPackageById);
    Router.post('/user/trading-packages/find-by-amount', userTradingPackageController.findPackageByAmount);
    Router.post('/user/trading-packages/calculate-returns', userTradingPackageController.calculateReturns);

    /**
     * OTP Settings Route (Public - No Authentication Required)
     * This route allows checking if OTP is enabled/disabled
     */
    Router.get('/user/otp-settings', userAuthController.getOTPSettings);

    // Public GET routes for RewardMaster
    Router.get('/get-all-reward-masters', async (req, res) => {
        try {
            const result = await RewardMaster.find({ active: true });
            return res.status(200).json({
                status: true,
                message: 'Reward masters retrieved successfully',
                result
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve reward masters',
                error: error.message
            });
        }
    });
    Router.get('/get-reward-master/:id', async (req, res) => {
        try {
            const { id } = req.params;
            if (!require('mongodb').ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid reward master ID'
                });
            }
            const rewardMaster = await RewardMaster.findById(id);
            if (!rewardMaster || !rewardMaster.active) {
                return res.status(404).json({
                    status: false,
                    message: 'Reward master not found'
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Reward master retrieved successfully',
                result: rewardMaster
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve reward master',
                error: error.message
            });
        }
    });

    /****************************
     * END OF UNAUTHORIZED ROUTES
     ****************************/

    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middlerware for Handling Request Authorization
     */
    Router.use('/', userAuthenticateMiddleware);
    // Router.post('/', userAuthenticateMiddleware);
    /**
     * Routes for handling user profile
     */
    // Router.post('/login', userInfoController.login)
    Router.get('/user/logout', userInfoController.logout);
    Router.get('/user/profile', userInfoController.profile);
    Router.get('/user/dashboard-data', userInfoController.dashboardData);
    Router.post('/socialMediaVerification/', userInfoController.socialMediaVerification)

    Router.put('/user/update_profile', [multerService.uploadFile('avatar').single('avatar'), validationMiddleware(userInfoValidation.updateProfile, 'body')], userInfoController.updateProfile);
    // Router.put('/user/update_profile', userInfoController.updateProfile);

    Router.post('/user/generate-2fa-secret', [userAuthenticateMiddleware], user2FAController.generate2faSecret);
    Router.post('/user/verify-otp', [userAuthenticateMiddleware, validationMiddleware(twoFaValidation.verifyOtp, 'body')], user2FAController.verifyOtp);
    Router.post('/user/enable-2fa', [userAuthenticateMiddleware], user2FAController.enable2FA);
    Router.post('/user/disable-2fa', [userAuthenticateMiddleware, validationMiddleware(twoFaValidation.disable2fa, 'body')], user2FAController.disable2fa);

    /**
     * 2FA Method Toggle Route
     */
    Router.post('/user/toggle-2fa-method', [userAuthenticateMiddleware, validationMiddleware(twoFaValidation.toggle2FAMethod, 'body')], user2FAController.toggle2FAMethod);

    /**
     * Routes for handle change password
     */
    Router.put('/user/change_password', validationMiddleware(userInfoValidation.changePassword, 'body'), userInfoController.changePassword);


    Router.get("/get-user-direct", userController.getAll);
    Router.get("/get-user-downline", userController.getDownline);
    Router.get("/get-user-downline-length", userController.getDownlineLength);
    Router.get("/search-users", userController.searchUsers);

    Router.get("/get-all-messages-inbox", userMessageController.getAllInbox);
    Router.get("/get-all-messages-sent", userMessageController.getAllSent);
    Router.get("/get-message/:id", userMessageController.getOne);
    Router.get("/get-message-count", userMessageController.getCount);
    Router.post("/add-message", validationMiddleware(messageValidation.add, 'body'), userMessageController.add);
    Router.put("/update-message", validationMiddleware(messageValidation.update, 'body'), userMessageController.update);

    Router.get("/get-all-settings", userSettingController.getAll);
    Router.get("/get-setting/:id", userSettingController.getOne);
    Router.get("/get-setting-with-name/:name", userSettingController.getOneByQuery);
    Router.post("/getObject", userSettingController.getObject);


    Router.get("/get-all-investment-plans", userInvestmentPlanController.getAll);
    Router.get("/get-investment-plan/:id", userInvestmentPlanController.getOne);
    Router.post("/create-investment-plan", userInvestmentPlanController.createPlan);

    /**
     * Investment Routes (Authentication Required)
     */
    Router.post("/add-membership", userInvestmentController.addMembership);
    Router.get("/get-all-investments", userInvestmentController.getAll);
    Router.get("/get-all-stacked", userInvestmentController.getAllStacked);
    Router.get("/get-all-stacked-token", userInvestmentController.getAllStackedToken);
    Router.get("/get-investment/:id", userInvestmentController.getOne);
    Router.get("/get-investment-sum", userInvestmentController.getSum);
    Router.post("/add-investment", validationMiddleware(investmentValidation.add, 'body'), userInvestmentController.addTradingPackage);

    /**
     * Trading Package Purchase Route (Authentication Required)
     * This route requires user to be logged in to purchase packages
     */
    Router.post("/add-trading-package", userInvestmentController.addTradingPackage);

    Router.get("/get-user-investments", userInvestmentController.getAllUserInvestments);
    Router.post("/addstake", validationMiddleware(investmentValidation.add2, 'body'), userInvestmentController.add2);
    Router.post("/addstakecoin", validationMiddleware(investmentValidation.add3, 'body'), userInvestmentController.add3);

    Router.get("/get-all-incomes", userIncomeController.getAll);
    Router.get("/get-daily-roi-incomes", userIncomeController.getDailyRoi);
    Router.get("/get-direct-incomes", userIncomeController.getDirectIncome);
    Router.get("/get-level-roi-incomes", userIncomeController.getLevelRoi);
    Router.get("/get-income/:id", userIncomeController.getOne);
    Router.get("/get-income-sum", userIncomeController.getSum);

    Router.get("/get-all-ranks", userRankController.getAll);
    Router.get("/get-rank/:id", userRankController.getOne);
    Router.get("/get-user-rank", userRankController.getUserRank);

    Router.get("/get-all-team-rewards", userTeamRewardController.getAll);
    Router.get("/get-team-reward/:id", userTeamRewardController.getOne);
    Router.get("/get-team-reward-sum", userTeamRewardController.getSum);

    Router.get("/get-all-fund-transfers", userFundTransferController.getAll);
    Router.get("/get-fund-transfer/:id", userFundTransferController.getOne);
    Router.get("/get-fund-transfer-sum", userFundTransferController.getSum);
    Router.post("/add-fund-transfer", validationMiddleware(fundTransferValidation.add, 'body'), userFundTransferController.add);

    Router.get("/get-all-deposits", userDepositController.getAll);
    Router.get("/get-deposit/:id", userDepositController.getOne);
    Router.get("/get-deposit-sum", userDepositController.getSum);
    Router.post("/add-deposit", validationMiddleware(depositValidation.add, 'body'), userDepositController.add);

    Router.get("/get-all-withdrawals", userWithdrawalController.getAll);
    Router.get("/get-withdrawal/:id", userWithdrawalController.getOne);
    Router.get("/get-withdrawal-sum", userWithdrawalController.getSum);
    Router.post("/add-withdrawal", validationMiddleware(withdrawalValidation.add, 'body'), userWithdrawalController.add);

    /**
    * Routes for handle support
    */

    Router.post("/support", validationMiddleware(supportValidation.add, "body"), userSupportController.add);

    /**
     * Routes for daily profit activation and status
     * Note: These routes are kept for backward compatibility
     * New implementations should use the /trade routes
     */
    Router.post("/user/activate-daily-profit", userTradeActivationController.activateDailyTrading);
    Router.get("/user/check-daily-profit-status", userTradeActivationController.getDailyTradingStatus);

    /**
     * Routes for handling admin login requests
     */
    Router.post("/user/login-request", userAuthController.userLoginRequest);
    Router.post("/user/login/request", userAuthController.userLoginRequest);

    /**
     * Routes for wallet generation and monitoring
     */
    Router.post("/generate-wallet", generateNewWallet);
    Router.post("/start-monitoring", startMonitoring);
    Router.post("/save-wallet", async (req, res) => {
        try {
            const { walletAddress, walletPrivateKey } = req.body;
            const user = req.user;
            const user_id = user.sub;

            if (!walletAddress || !walletPrivateKey) {
                return res.status(400).json({
                    status: false,
                    message: 'Wallet address and private key are required'
                });
            }

            // Update user model with wallet address and private key
            const { userDbHandler } = require('../../services/db');
            await userDbHandler.updateById(user_id, {
                wallet_address: walletAddress,
                wallet_private_key: walletPrivateKey
            });

            return res.status(200).json({
                status: true,
                message: 'Wallet saved successfully'
            });
        } catch (error) {
            console.error('Error saving wallet:', error);
            return res.status(500).json({
                status: false,
                message: 'Error saving wallet: ' + error.message
            });
        }
    });

    /**
     * Route for withdrawal requests (admin approval required)
     */
    Router.post("/request-withdrawal", userWithdrawalController.requestWithdrawal);

    /**
     * Routes for releasing staking
     */
    Router.post("/release-staking-to-wallet", userWithdrawalController.releaseStakingToWallet);
    Router.post("/release-staking-to-trade-wallet", userWithdrawalController.releaseStakingToTradeWallet);

    /**
     * Announcement routes for users
     */
    const announcementRoutes = require('./announcement.route');
    Router.use('/', announcementRoutes);

    /**
     * Trade activation routes for users
     */
    const tradeActivationRoutes = require('./trade.activation.routes');
    Router.use('/trade', tradeActivationRoutes);

    /**
     * Notification routes for users
     */
    const notificationRoutes = require('./notification.routes');
    Router.use('/notifications', notificationRoutes);

    // Add this after userAuthenticateMiddleware is applied
    Router.get('/user/active-rewards', async (req, res) => {
        try {
            const rewards = await RewardMaster.find({ active: true });
            return res.status(200).json({
                status: true,
                message: 'Active rewards fetched successfully',
                result: rewards
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch active rewards',
                error: error.message
            });
        }
    });

    // Reward application route
    const rewardController = require('../../controllers/user/reward.controller');
    Router.post('/user/rewards/apply', rewardController.applyForReward);
    Router.get('/user/rewards/applications', rewardController.getUserRewardApplications);

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
};