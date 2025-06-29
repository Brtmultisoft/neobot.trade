'use strict';
const logger = require('../../services/logger');
const log = new logger('InveatmentController').getChildLogger();
const { investmentDbHandler, investmentPlanDbHandler, userDbHandler, incomeDbHandler, settingDbHandler } = require('../../services/db');
const { getTopLevelByRefer } = require('../../services/commonFun');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const {ethers} = require("ethers")
const { userModel, tradingPackageModel } = require('../../models');
const {distributeLevelIncome, distributeGlobalAutoPoolMatrixIncome, processTeamCommission} = require("./cron.controller")

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { now } = require('mongoose')

// Create a trading package investment
const createTradingPackageInvestment = async (user_id, amount, plan) => {
    try {
        console.log('Creating trading package investment with:');
        console.log('- User ID:', user_id);
        console.log('- Amount:', amount);
        console.log('- Plan ID:', plan._id);
        console.log('- Plan percentage:', plan.percentage);

        // Create the investment object
        const investmentData = {
            user_id,
            investment_plan_id: plan._id,
            trading_package_id: plan.extra?.original_package_id || plan._id, // Store the actual trading package ID
            amount: amount,
            daily_profit: plan.percentage || 1,
            status: "active", // Use numeric status 1 for active (for compatibility with both string and numeric status checks)
            package_type: 'trading',
            type: 0, // For compatibility with existing code
            start_date: new Date(),
            last_profit_date: new Date(),
            extra: {
                plan_name: plan.title || 'Trading Package',
                package_id: plan._id,
                trading_package_id: plan.extra?.original_package_id || plan._id, // Also store in extra for backward compatibility
                daily_roi_percentage: plan.percentage
            }
        };

        console.log('Investment data prepared:', JSON.stringify(investmentData));

        // Create investment entry for trading package
        const investment = await investmentDbHandler.create(investmentData);

        console.log('Investment created successfully:', investment._id);
        return investment;
    } catch (error) {
        console.error('Failed to create trading package investment:', error);
        log.error('Failed to create trading package investment:', error);
        throw error;
    }
};

// Legacy function for backward compatibility
// const createInvestmentPackages = async (user_id, slotValue, amount) => {
//     const packages = ['x3', 'x6', 'x9'];
//     const investments = [];

//     try {
//         // Create investment entries for all three packages
//         for (const packageType of packages) {
//             const investment = await investmentDbHandler.create({
//                 user_id,
//                 slot_value: slotValue,
//                 amount: amount,
//                 package_type: packageType,
//                 status: 1
//             });
//             investments.push(investment);
//         }

//         return investments;
//     } catch (error) {
//         log.error('Failed to create investment packages:', error);
//         throw error;
//     }
// };

module.exports = {
    // New method for trading package investment
    addTradingPackage: async (req, res) => {
        let responseData = {};
        try {
            // Debug: Log request body
            console.log('Request body:', req.body);

            const { amount, package_id, daily_profit } = req.body;
            const user_id = req.user.sub;

            // Debug: Log user ID
            console.log('User ID:', user_id);
            console.log('Investment amount:', amount);
            console.log('Package ID:', package_id);
            console.log('Daily profit:', daily_profit);

            // Basic amount validation - will be validated against package later
            if (!amount || amount <= 0) {
                responseData.msg = "Investment amount must be greater than 0";
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getOneByQuery({_id : user_id });

            // Debug: Log user data
            console.log('User data:', user ? 'User found' : 'User not found');
            if (user) {
                console.log('User wallet balance:', user.wallet);
                console.log('User last investment amount:', user.last_investment_amount);
            }

            if (!user) {
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
            }

            // Check if user has sufficient balance in wallet_topup
            if (user.wallet_topup < amount) {
                responseData.msg = "Insufficient top-up wallet balance";
                return responseHelper.error(res, responseData);
            }


            // Fetch trading packages from database
            console.log('Fetching trading packages from database...');
            let selectedPackage = null;

            try {
                const mongoose = require('mongoose');
                const TradingPackage = mongoose.model('TradingPackages');

                // First, try to find by package_id if provided
                if (package_id) {
                    selectedPackage = await TradingPackage.findOne({ _id: package_id, status: true });
                    console.log('Package found by ID:', selectedPackage ? selectedPackage.name : 'Not found');
                }

                // If not found by ID, find by amount range using the model's static method
                if (!selectedPackage) {
                    selectedPackage = await TradingPackage.findByTradingAmount(amount);
                    console.log('Package found by amount:', selectedPackage ? selectedPackage.name : 'Not found');
                }

            } catch (err) {
                console.error('Error fetching trading packages:', err);
            }

            // Fallback to simple logic if no packages found
            if (!selectedPackage) {
                console.log('No trading packages found, using fallback logic');
                const calculatedDailyProfit = amount < 500 ? 1 : 1.15;
                const finalDailyProfit = daily_profit || calculatedDailyProfit;

                selectedPackage = {
                    _id: 'fallback-package',
                    name: amount < 500 ? 'Silver' : 'Gold',
                    daily_trading_roi: finalDailyProfit,
                    trading_amount_from: amount < 500 ? 100 : 500, // Updated minimum to $100
                    trading_amount_to: amount < 500 ? 4999 : null,  // Updated maximum to $4999
                    is_unlimited: amount >= 500,
                    status: true,
                    package_number: amount < 500 ? 1 : 2,
                    description: amount < 500 ? 'Silver trading package for beginners' : 'Gold trading package for advanced traders',
                    features: amount < 500
                        ? ['1% Daily ROI', 'Minimum $100', 'Maximum $4999', '10% Referral Bonus']
                        : ['1.15% Daily ROI', 'Minimum $500', 'Unlimited Maximum', '10% Referral Bonus'],
                    extra: {
                        tier: amount < 500 ? 'silver' : 'gold',
                        color: amount < 500 ? '#C0C0C0' : '#FFD700',
                        recommended: amount >= 500
                    }
                };
            }

            // Validate investment amount against selected package
            console.log('Validating investment amount against package limits');
            console.log('Package minimum:', selectedPackage.trading_amount_from);
            console.log('Package maximum:', selectedPackage.trading_amount_to);
            console.log('Package is unlimited:', selectedPackage.is_unlimited);

            if (amount < selectedPackage.trading_amount_from) {
                responseData.msg = `Investment amount must be at least $${selectedPackage.trading_amount_from} for ${selectedPackage.name} package`;
                return responseHelper.error(res, responseData);
            }

            if (!selectedPackage.is_unlimited && selectedPackage.trading_amount_to && amount > selectedPackage.trading_amount_to) {
                responseData.msg = `Investment amount cannot exceed $${selectedPackage.trading_amount_to} for ${selectedPackage.name} package`;
                return responseHelper.error(res, responseData);
            }

            console.log('Investment amount validation passed');

            // Create plan object for investment
            const plan = {
                _id: selectedPackage._id,
                title: selectedPackage.name,
                percentage: daily_profit || selectedPackage.daily_trading_roi,
                amount_from: selectedPackage.trading_amount_from,
                amount_to: selectedPackage.trading_amount_to,
                is_unlimited: selectedPackage.is_unlimited,
                referral_bonus: 10, // 10% referral bonus as requested
                extra: {
                    package_name: selectedPackage.name,
                    tier: selectedPackage.extra?.tier || 'standard',
                    daily_roi: daily_profit || selectedPackage.daily_trading_roi,
                    original_package_id: selectedPackage._id
                }
            };

            console.log('Selected trading package:', plan.title);
            console.log('Daily ROI:', plan.percentage + '%');
            console.log('Referral bonus:', plan.referral_bonus + '%');

            // Process first deposit bonus if this is user's first investment
            const userInvestments = await investmentDbHandler.getByQuery({ user_id: user_id });

            // Debug: Log user investments
            console.log('User investments count:', userInvestments.length);

            let firstDepositBonus = 0;

            // if (userInvestments.length === 0) {
            //     // This is the first deposit, calculate bonus
            //     console.log('First deposit detected, calculating bonus');
            //     console.log('First deposit bonus structure:', plan.first_deposit_bonus);

            //     const bonusThresholds = Object.keys(plan.first_deposit_bonus)
            //         .map(Number)
            //         .sort((a, b) => a - b);

            //     console.log('Bonus thresholds:', bonusThresholds);

            //     // Find the highest threshold that is less than or equal to the investment amount
            //     let applicableThreshold = 0;
            //     for (const threshold of bonusThresholds) {
            //         if (amount >= threshold) {
            //             applicableThreshold = threshold;
            //         } else {
            //             break;
            //         }
            //     }

            //     console.log('Applicable threshold:', applicableThreshold);

            //     if (applicableThreshold > 0) {
            //         firstDepositBonus = plan.first_deposit_bonus[applicableThreshold];
            //         console.log('First deposit bonus amount:', firstDepositBonus);

            //         // Create first deposit bonus income record
            //         const bonusIncome = await incomeDbHandler.create({
            //             user_id: ObjectId(user_id),
            //             investment_id: null, // Will be updated after investment is created
            //             type: 'first_deposit_bonus',
            //             amount: firstDepositBonus,
            //             status: 'credited',
            //             description: 'First deposit bonus',
            //             extra: {
            //                 investmentAmount: amount,
            //                 bonusThreshold: applicableThreshold
            //             }
            //         });

            //         console.log('Bonus income created:', bonusIncome ? 'Success' : 'Failed');

            //         // Add bonus to user's wallet
            //         const walletUpdate = await userDbHandler.updateOneByQuery({_id: user_id}, {
            //             $inc: { wallet: firstDepositBonus }
            //         });

            //         console.log('Wallet updated with bonus:', walletUpdate ? 'Success' : 'Failed');
            //     }
            // }

            // Process referral bonus if user has a referrer
            try {
                // --- REFERRAL BONUS LOGIC ---
                // Referrer ko har naye referred user par ek hi baar bonus milega
                console.log('[REFERRAL BONUS] user.refer_id:', user.refer_id);
                if (user.refer_id) {
                    const referrer = await userDbHandler.getById(user.refer_id);
                    console.log('[REFERRAL BONUS] referrer:', referrer ? referrer.username || referrer.email : null);
                    if (referrer) {
                        // Check if referral bonus has already been given from this user to this referrer
                        const existingReferralBonus = await incomeDbHandler.getOneByQuery({
                            user_id: ObjectId(referrer._id), // Referrer
                            user_id_from: ObjectId(user_id),  // Referred user
                            type: 'referral_bonus'
                        });
                        console.log('[REFERRAL BONUS] existingReferralBonus:', existingReferralBonus);
                        if (!existingReferralBonus) {
                            // Calculate referral bonus - 10% of investment amount
                            const referralBonusRate = 10;
                            const referralBonus = (amount * referralBonusRate) / 100;
                            console.log(`[REFERRAL BONUS] Crediting referral bonus of ${referralBonus} to referrer ${referrer.username || referrer.email}`);
                            // Create referral bonus income record
                            await incomeDbHandler.create({
                                user_id: ObjectId(referrer._id),
                                user_id_from: ObjectId(user_id),
                                type: 'referral_bonus',
                                amount: referralBonus,
                                status: 'credited',
                                description: 'Direct Referral Commission',
                                extra: {
                                    referralAmount: amount,
                                    commissionRate: referralBonusRate,
                                    fromUser: user_id,
                                    timestamp: new Date().toISOString(),
                                    isFirstReferralBonus: true
                                }
                            });
                            // Add bonus to referrer's wallet and update directIncome tracking
                            if (!referrer.extra) {
                                await userDbHandler.updateOneByQuery(
                                    {_id: referrer._id},
                                    { $set: { extra: { directIncome: 0, totalIncome: 0 } } }
                                );
                            }
                            await userDbHandler.updateOneByQuery(
                                {_id: referrer._id},
                                {
                                    $inc: {
                                        wallet: referralBonus,
                                        "extra.directIncome": referralBonus,
                                        "extra.totalIncome": referralBonus
                                    }
                                }
                            );
                        } else {
                            console.log(`[REFERRAL BONUS] Bonus already given to referrer ${referrer.username || referrer.email} for user ${user.username || user.email}`);
                        }
                    } else {
                        console.log('[REFERRAL BONUS] No referrer found for user:', user.username || user.email);
                    }
                } else {
                    console.log('[REFERRAL BONUS] No refer_id for user:', user.username || user.email);
                }
            } catch (error) {
                console.error('Error processing referral bonus:', error);
            }

            // Create the investment
            console.log('Creating investment with plan:', plan.title);
            const investment = await createTradingPackageInvestment(user_id, amount, plan);
            console.log('Investment created:', investment ? 'Success' : 'Failed');
            if (investment) {
                console.log('Investment ID:', investment._id);
            }

            // Update user's wallet_topup and total investment
            console.log('Updating user wallet_topup. Current wallet_topup balance:', user.wallet_topup);
            console.log('Amount to deduct:', amount);

            try {
                // Use updateOneByQuery instead of updateById for more reliable updates
                const walletUpdate = await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    {
                        $inc: {
                            wallet_topup: -amount,
                            total_investment: amount
                        },
                        $set: {
                            last_investment_amount: amount,
                            current_trading_package_id: plan.extra?.original_package_id || plan._id,
                            current_package_investment_time: new Date()
                        }
                    }
                );

                console.log('Wallet update result:', JSON.stringify(walletUpdate));

                // Verify the update was successful
                if (!walletUpdate || !walletUpdate.acknowledged || walletUpdate.modifiedCount === 0) {
                    throw new Error('Wallet update failed');
                }

                // Get updated user data to confirm the change
                const updatedUser = await userDbHandler.getById(user_id);
                console.log('Updated wallet_topup balance:', updatedUser.wallet_topup);
                console.log('Updated current_trading_package_id:', updatedUser.current_trading_package_id);
                console.log('Updated current_package_investment_time:', updatedUser.current_package_investment_time);
                console.log('User wallet_topup and package info updated after investment: Success');
            } catch (walletError) {
                console.error('Error updating wallet_topup:', walletError);
                throw new Error(`Failed to update wallet_topup: ${walletError.message}`);
            }

            // Team commission (Level ROI income) will be processed by the daily cron job
            console.log('Team commission (Level ROI income) will be processed by the daily cron job');
            // Not processing team commission in real-time as per requirement

            // Update first deposit bonus income with investment ID if applicable
            if (firstDepositBonus > 0) {
                console.log('Updating first deposit bonus income with investment ID');
                const bonusUpdate = await incomeDbHandler.updateByQuery(
                    {
                        user_id: ObjectId(user_id),
                        type: 'first_deposit_bonus',
                        'extra.investmentAmount': amount
                    },
                    { $set: { investment_id: investment._id } }
                );

                console.log('Bonus income updated:', bonusUpdate ? 'Success' : 'Failed');
            }

            responseData.msg = "Trading package investment successful!";
            responseData.data = {
                investment: investment,
                firstDepositBonus: firstDepositBonus
            };
            return responseHelper.success(res, responseData);

        }catch(error) {
            console.error('Trading package investment failed with error:', error);
            log.error('Trading package investment failed:', error);
            responseData.msg = "Failed to process investment";
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            // reqObj.type = 0;
            let getList = await investmentDbHandler.getAllInUser(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
    getAllStacked: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            reqObj.type = 1;
            let getList = await investmentDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
    getAllStackedToken: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            reqObj.type = 2;
            let getList = await investmentDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let id = req.params.id;
        try {
            let getData = await investmentPlanDbHandler.getById(id);
            console.log("*************");
            console.log(id)
            console.log(getData)
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

// BACKEND: Updated function to handle package_id and daily_profit
add: async (req, res) => {
    let responseData = {};
    try {
        const { amount, package_id, daily_profit } = req.body; // Accept additional parameters
        const user_id = req.user.sub;

        console.log('=== INVESTMENT PROCESS STARTED ===');
        console.log('User ID:', user_id);
        console.log('Investment Amount:', amount);
        console.log('Package ID:', package_id);
        console.log('Daily Profit:', daily_profit);

        // Validate amount
        if (amount < 50 || amount > 100000) {
            responseData.msg = "Investment amount must be between $50 and $100,000";
            return responseHelper.error(res, responseData);
        }

        // Get user
        const user = await userDbHandler.getById(user_id);
        if (!user) {
            responseData.msg = "User not found";
            return responseHelper.error(res, responseData);
        }

        console.log('User found:', {
            id: user._id,
            name: user.name || user.username,
            wallet_topup: user.wallet_topup,
            refer_id: user.refer_id
        });

        // Check if user has sufficient balance in wallet_topup
        if (user.wallet_topup < amount) {
            responseData.msg = "Insufficient top-up wallet balance";
            return responseHelper.error(res, responseData);
        }

        // Check if investment amount is greater than or equal to last investment
        if (user.last_investment_amount > 0 && amount < user.last_investment_amount) {
            responseData.msg = `New investment amount must be greater than or equal to your last investment of ${user.last_investment_amount}`;
            return responseHelper.error(res, responseData);
        }

        // Get trading package - use specific package if provided, otherwise find by amount
        let plan;
        if (package_id) {
            console.log('Getting specific trading package by ID:', package_id);
            plan = await TradingPackage.findById(package_id);
            if (!plan || plan.is_deleted || !plan.status) {
                responseData.msg = "Selected trading package not found or inactive";
                return responseHelper.error(res, responseData);
            }
            
            // Validate if amount is within package range
            if (!plan.isAmountInRange(amount)) {
                responseData.msg = `Investment amount ${amount} is not within the range of selected package (${plan.trading_amount_from} - ${plan.is_unlimited ? 'unlimited' : plan.trading_amount_to})`;
                return responseHelper.error(res, responseData);
            }
        } else {
            console.log('Finding trading package by amount:', amount);
            plan = await TradingPackages.findByTradingAmount(amount);
            if (!plan) {
                responseData.msg = `No active trading package found for investment amount ${amount}`;
                return responseHelper.error(res, responseData);
            }
        }

        console.log('Trading package found:', {
            id: plan._id,
            name: plan.name,
            package_number: plan.package_number,
            daily_trading_roi: plan.daily_trading_roi,
            range: `${plan.trading_amount_from} - ${plan.is_unlimited ? 'unlimited' : plan.trading_amount_to}`
        });

        // Use the package's daily_trading_roi, or override if daily_profit is provided
        const dailyRoi = (daily_profit && typeof daily_profit === 'number' && daily_profit > 0) 
            ? daily_profit 
            : plan.daily_trading_roi;
        
        if (daily_profit && daily_profit !== plan.daily_trading_roi) {
            console.log(`Using custom daily profit: ${daily_profit}% instead of package default: ${plan.daily_trading_roi}%`);
        }

        // Process referral bonus BEFORE creating investment
        let referralBonusGiven = false;
        if (user.refer_id) {
            console.log('=== PROCESSING REFERRAL BONUS ===');
            console.log('User has referrer ID:', user.refer_id);
            
            try {
                const referrer = await userDbHandler.getById(user.refer_id);
                console.log('Referrer lookup result:', referrer ? 'Found' : 'Not found');
                
                if (referrer) {
                    console.log('Referrer details:', {
                        id: referrer._id,
                        name: referrer.name || referrer.username,
                        current_wallet: referrer.wallet,
                        current_extra: referrer.extra
                    });

                    // Calculate 10% referral bonus
                    const referralBonus = Math.round((amount * 0.10) * 100) / 100; // Round to 2 decimal places
                    console.log(`Calculating referral bonus: ${amount} * 0.10 = ${referralBonus}`);

                    // Step 1: Create income record
                    console.log('Creating referral income record...');
                    const incomeRecord = await incomeDbHandler.create({
                        user_id: referrer._id, // Make sure this is the correct format your DB expects
                        user_id_from: user_id,
                        investment_id: null, // Will update later
                        type: 'referral_bonus',
                        amount: referralBonus,
                        status: 'credited',
                        description: `Referral Commission - 10% of ${amount} investment`,
                        created_at: new Date(),
                        extra: {
                            referralAmount: amount,
                            bonusPercentage: 10,
                            fromUser: user_id,
                            fromUserName: user.name || user.username || 'Unknown',
                            timestamp: new Date().toISOString(),
                            packageId: package_id,
                            dailyProfit: daily_profit
                        }
                    });

                    console.log('Income record creation result:', incomeRecord ? 'SUCCESS' : 'FAILED');
                    if (incomeRecord) {
                        console.log('Income record ID:', incomeRecord._id);
                    }

                    // Step 2: Initialize extra field if needed
                    console.log('Checking referrer extra field...');
                    if (!referrer.extra) {
                        console.log('Initializing extra field for referrer...');
                        await userDbHandler.updateOneByQuery(
                            { _id: referrer._id },
                            { 
                                $set: { 
                                    extra: { 
                                        directIncome: 0, 
                                        totalIncome: 0 
                                    } 
                                } 
                            }
                        );
                        console.log('Extra field initialized');
                    }

                    // Step 3: Update referrer wallet
                    console.log('Updating referrer wallet...');
                    console.log('Before update - Referrer wallet:', referrer.wallet);
                    
                    const walletUpdateResult = await userDbHandler.updateOneByQuery(
                        { _id: referrer._id },
                        {
                            $inc: {
                                wallet: referralBonus,
                                "extra.directIncome": referralBonus,
                                "extra.totalIncome": referralBonus
                            }
                        }
                    );

                    console.log('Wallet update result:', walletUpdateResult);
                    console.log('Update acknowledged:', walletUpdateResult?.acknowledged);
                    console.log('Modified count:', walletUpdateResult?.modifiedCount);

                    // Step 4: Verify the update
                    const updatedReferrer = await userDbHandler.getById(referrer._id);
                    console.log('After update - Referrer wallet:', updatedReferrer.wallet);
                    console.log('After update - Direct income:', updatedReferrer.extra?.directIncome);

                    if (updatedReferrer.wallet > referrer.wallet) {
                        console.log('✅ REFERRAL BONUS SUCCESSFULLY ADDED!');
                        console.log(`✅ Referrer ${referrer._id} received ${referralBonus} for investment of ${amount}`);
                        referralBonusGiven = true;
                    } else {
                        console.log('❌ REFERRAL BONUS FAILED - Wallet not updated');
                    }

                } else {
                    console.log('❌ Referrer not found in database');
                }
            } catch (referralError) {
                console.error('❌ ERROR in referral bonus processing:', referralError);
                console.error('Error stack:', referralError.stack);
            }
        } else {
            console.log('User has no referrer, skipping referral bonus');
        }

        // Create the investment with the trading package
        console.log('=== CREATING INVESTMENT ===');
        const investment = await createTradingPackageInvestment(user_id, amount, plan, dailyRoi);
        if (!investment) {
            throw new Error('Failed to create investment');
        }
        console.log('Investment created successfully:', investment._id);

        // Update investment ID in referral bonus record if it was created
        if (referralBonusGiven && user.refer_id) {
            try {
                console.log('Updating referral income record with investment ID...');
                await incomeDbHandler.updateByQuery(
                    {
                        user_id: user.refer_id,
                        user_id_from: user_id,
                        type: 'referral_bonus',
                        investment_id: null
                    },
                    { 
                        $set: { 
                            investment_id: investment._id 
                        } 
                    }
                );
                console.log('Referral income record updated with investment ID');
            } catch (updateError) {
                console.error('Failed to update income record with investment ID:', updateError);
            }
        }

        // Update user's wallet_topup and total investment
        console.log('=== UPDATING USER WALLET ===');
        console.log('Current wallet_topup:', user.wallet_topup);
        console.log('Amount to deduct:', amount);

        const userWalletUpdate = await userDbHandler.updateOneByQuery(
            { _id: user_id },
            {
                $inc: {
                    wallet_topup: -amount,
                    total_investment: amount
                },
                $set: {
                    last_investment_amount: amount
                }
            }
        );

        console.log('User wallet update result:', userWalletUpdate);

        if (!userWalletUpdate || !userWalletUpdate.acknowledged || userWalletUpdate.modifiedCount === 0) {
            throw new Error('User wallet update failed');
        }

        // Verify user wallet update
        const updatedUser = await userDbHandler.getById(user_id);
        console.log('Updated user wallet_topup:', updatedUser.wallet_topup);

        // Process team commission
        try {
            console.log('=== PROCESSING TEAM COMMISSION ===');
            const teamCommissionResult = await processTeamCommission(user_id, amount);
            console.log('Team commission result:', teamCommissionResult ? 'Success' : 'Failed');
        } catch (commissionError) {
            console.error('Team commission error:', commissionError);
        }

        console.log('=== INVESTMENT PROCESS COMPLETED ===');

        responseData.msg = "Trading package investment successful!";
        responseData.data = {
            investment: investment,
            tradingPackage: {
                id: plan._id,
                name: plan.name,
                package_number: plan.package_number,
                daily_trading_roi: plan.daily_trading_roi,
                used_daily_roi: dailyRoi,
                trading_range: {
                    from: plan.trading_amount_from,
                    to: plan.is_unlimited ? null : plan.trading_amount_to,
                    is_unlimited: plan.is_unlimited
                }
            },
            referralBonusGiven: referralBonusGiven,
            referralAmount: referralBonusGiven ? Math.round((amount * 0.10) * 100) / 100 : 0
        };
        return responseHelper.success(res, responseData);

    } catch (error) {
        console.error('❌ INVESTMENT PROCESS FAILED:', error);
        console.error('Error stack:', error.stack);
        responseData.msg = `Failed to process investment: ${error.message}`;
        return responseHelper.error(res, responseData);
    }
},
    
    
    addMembership : async (req, res) => {
        console.log(req.body)
        let responseData = {};
        try {
            const {membershipType} = req.body;
            const user_id = req.user.sub;

             const amount = membershipType == "prime" ? 2500 : 5000;
             const user = await userDbHandler.getById(user_id);
             if(!user){
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
             }
            //  if(user.wallet < amount){
            //      responseData.msg = "Insufficient Balance";
            //      return responseHelper.error(res, responseData);
            //  }

            console.log('Updating user wallet for membership. Current wallet balance:', user.wallet);
            console.log('Membership amount to deduct:', amount);

            try {
                const walletUpdate = await userDbHandler.updateOneByQuery(
                    {_id : user_id},
                    {
                        $inc : {
                            wallet : -amount
                        },
                        $set : {
                            isPrimeMember : membershipType == "prime" ? true : user.isPrimeMember,
                            isFounderMember : membershipType == "founder" ? true : user.isFounderMember
                        }
                    }
                );

                console.log('Membership wallet update result:', JSON.stringify(walletUpdate));

                // Verify the update was successful
                if (!walletUpdate || !walletUpdate.acknowledged || walletUpdate.modifiedCount === 0) {
                    throw new Error('Membership wallet update failed');
                }

                // Get updated user data to confirm the change
                const updatedUser = await userDbHandler.getById(user_id);
                console.log('Updated wallet balance after membership:', updatedUser.wallet);
            } catch (walletError) {
                console.error('Error updating wallet for membership:', walletError);
                throw new Error(`Failed to update wallet for membership: ${walletError.message}`);
            }

            try {
                console.log('Creating membership investment record');
                const investmentData = {
                    user_id : user_id,
                    amount : amount,
                    package_type : membershipType,
                    status : "active",
                    type : membershipType == "prime" ? 3 : 4,
                };

                console.log('Membership investment data:', JSON.stringify(investmentData));

                const investment = await investmentDbHandler.create(investmentData);

                console.log('Membership investment created:', investment ? 'Success' : 'Failed');
                if (investment) {
                    console.log('Membership investment ID:', investment._id);
                }
            } catch (investmentError) {
                console.error('Error creating membership investment:', investmentError);
                throw new Error(`Failed to create membership investment: ${investmentError.message}`);
            }
             responseData.msg = `${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)} membership activated successfully!`;
             responseData.data = {
                 membershipType: membershipType
             };
             return responseHelper.success(res, responseData);

        } catch (error) {
            console.error('Membership activation failed:', error);
            responseData.msg = "Failed to activate membership";
            return responseHelper.error(res, responseData);
        }
    },
    add2: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = { _id: ObjectId(user.sub) };
        let reqObj = req.body;

        try {
            let amount = reqObj.amount;

            // Check if amount is valid
            if (amount <= 0) {
                responseData.msg = "Amount must be greater than zero.";
                return responseHelper.error(res, responseData);
            }

            // Fetch user wallet balance
            const userRecord = await userDbHandler.getById(user_id);
            if (!userRecord) {
                responseData.msg = "User not found.";
                return responseHelper.error(res, responseData);
            }

            const walletBalance = userRecord.wallet_topup || 0;

            // Check if amount is greater than wallet balance
            if (amount > walletBalance) {
                responseData.msg = "Insufficient wallet balance.";
                return responseHelper.error(res, responseData);
            }

            // Ensure stacked_amount is a number
            let wallet = parseFloat(userRecord.wallet) || 0;
            //  Note wallet_topup is Total Bought ICO
            //  Note wallet is Stacked ICO
            // Deduct amount from wallet
            await userDbHandler.updateOneByQuery(user_id, {
                $inc: { wallet_topup: -amount }
            }).then(async response => {
                if (!response.acknowledged || response.modifiedCount === 0) throw "Amount not deducted!";

                // Update stacked amount
                await userDbHandler.updateOneByQuery(user_id, {
                    $inc: { wallet: +amount }
                }).then(async response => {
                    if (!response.acknowledged || response.modifiedCount === 0) throw "User Topup Value is not updated!";
                }).catch(e => { throw `Error while updating topup amount: ${e}` });
            }).catch(e => { throw `Error while deducting amount: ${e}` });
            let data = {
                user_id: user_id,
                type: 1,
                amount: amount,

                status: 2
            }

            let iData = await investmentDbHandler.create(data);
            responseData.msg = "Stacked successful!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update data with error:', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    add3: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = { _id: ObjectId(user.sub) };
        let reqObj = req.body;

        try {
            let amount = reqObj.amount;

            let investment_plan_id = reqObj.investment_plan_id;

            await userDbHandler.updateOneByQuery(user_id,
                {
                    $inc: { wallet_token: +amount }
                }
            ).then(async response => {

                if (!response.acknowledged || response.modifiedCount === 0) throw `Amount not deducted !!!`

                await userDbHandler.updateOneByQuery({ _id: user_id },
                    {
                        $inc: { topup: amount }
                    }
                ).then(async response => {
                    if (!response.acknowledged || response.modifiedCount === 0) throw `User Topup Value is not updated !!!`
                }).catch(e => { throw `Error while updating topup amount: ${e}` })

            }).catch(e => { throw `Error while adding token amount: ${e}` })

            let data = {
                user_id: user_id,
                type: 2,
                amount: amount,

                status: 2
            }

            let iData = await investmentDbHandler.create(data);
            responseData.msg = "Stacked successful!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update data with error:', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    getCount: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await investmentDbHandler.getCount(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // Add function to get user's investments across all packages
    getAllUserInvestments: async (req, res) => {
        let responseData = {};
        try {
            const user_id = req.user.sub;
            const investments = await investmentDbHandler.getByQuery({
                user_id,
                status: { $in: ['1', 'active'] },
                package_type: 'trading'
            });

            responseData.msg = "Investments fetched successfully";
            responseData.data = investments;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch user investments:', error);
            responseData.msg = "Failed to fetch investments";
            return responseHelper.error(res, responseData);
        }
    },

    getSum: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            console.log('Getting investment sum for user:', user_id);
            let getData = await investmentDbHandler.getSum(reqObj, user_id);
            console.log('Investment sum result:', getData);

            // If no investments found, return default values
            if (!getData || getData.length === 0) {
                responseData.msg = "Data fetched successfully!";
                responseData.data = [{ amount: 0, count: 0 }];
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },


};