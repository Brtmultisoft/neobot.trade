'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminUsersController').getChildLogger();
const { userDbHandler, verificationDbHandler, messageDbHandler, socialLinksDbHandler } = require('../../services/db');
const { getChildLevelsByRefer } = require('../../services/commonFun');
const bcrypt = require('bcryptjs');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const templates = require('../../utils/templates/template');
const emailService = require('../../services/sendEmail');
/*******************
 * PRIVATE FUNCTIONS
 ********************/

let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function (err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) reject(err);
                // override the plain password with the hashed one
                resolve(hash);
            });
        });
    });
};
/**
 * Method to generate jwt token
 */
let _generateVerificationToken = (tokenData, verification_type) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtVerificationToken(tokenData, verification_type);
    return token;
};

/*******************
* PRIVATE FUNCTIONS
********************/
/**
* Method to Compare password
*/
let _comparePassword = (reqPassword, userPassword) => {
    return new Promise((resolve, reject) => {
        //compare password with bcrypt method, password and hashed password both are required
        bcrypt.compare(reqPassword, userPassword, function (err, isMatch) {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};

// Method to create hash password on update
let _createHashPassword = async (password) => {
    let salt = config.bcrypt.saltValue;
    const saltpass = await bcrypt.genSalt(salt);
    // now we set user password to hashed password
    let hashedPassword = await bcrypt.hash(password, saltpass);
    return hashedPassword;
}

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll Users:', reqObj);
        console.log(reqObj)
        let responseData = {};
        try {
            let getList;
            if (reqObj?.limit == -1) {
                getList = await userDbHandler.getByQuery({}, {
                    'username': 1,
                    'name': 1,
                    'email': 1,
                    'status': 1,
                    'is_blocked': 1,
                    'block_reason': 1,
                    'two_fa_enabled': 1,
                    'two_fa_method': 1
                });
            }
            else {
                getList = await userDbHandler.getAll(reqObj);
            }

            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch users data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
    get_daily_task_data: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll Users:', reqObj);
        console.log("aya%%%%%%%%%%%%%%")
        console.log(reqObj)
        let responseData = {};
        try {

            let getList;
            if (reqObj?.limit == -1) {
                getList = await socialLinksDbHandler.getByQuery({'user_id':1}, { 'user_id': 1, 'url': 1});
                console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^")
            }
            else {
                getList = await socialLinksDbHandler.getAll(reqObj);
                console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
                console.log(getList)

            }

            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get all users data with error::', error);
            responseData.msg = 'Failed to get Data';
            return responseHelper.error(res, responseData);
        }

    },
    get_daily_task_data2: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll Users:', reqObj);
        console.log("aya%%%%%%%%%%%%%%")
        console.log(reqObj)
        let responseData = {};
        try {

            let getList;
                getList = await socialLinksDbHandler.getAllWithoutLimit(reqObj);
                console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
                console.log(getList)


            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get all users data with error::', error);
            responseData.msg = 'Failed to get Data';
            return responseHelper.error(res, responseData);
        }

    },

    getDownline: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getDownline Users:', reqObj);
        let responseData = {};
        try {
            // Get the downline data with complete user information
            let getList = await getChildLevelsByRefer(null, true, 20);
            console.log('getDownline result:', getList);

            // Process each level to ensure we have complete user data
            const processedList = getList.levels.map(level => {
                // If the level contains user objects, return them with all fields
                if (level && level.length > 0 && typeof level[0] === 'object') {
                    return level.map(user => {
                        // Ensure we're returning a plain object, not a Mongoose document
                        return user.toObject ? user.toObject() : user;
                    });
                }
                // If it's just IDs, return them as is
                return level;
            });

            log.info(`Processed downline data with ${processedList.length} levels`);

            responseData.msg = 'Data fetched successfully!';
            responseData.data = processedList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch users data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let status = null;
        if (req?.query?.status !== null) {
            status = req?.query?.status ? true : false;
        }
        try {
            let getData = await messageDbHandler.getCount(null, status);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let userId = req.params.id;
        let responseData = {};
        try {
            console.log('Fetching user by ID:', userId);
            let getDetail = await userDbHandler.getById(userId, { password: 0 });

            console.log('User fetch result:', getDetail);

            if (!getDetail) {
                responseData.msg = 'User not found with this ID';
                return responseHelper.error(res, responseData);
            }

            // Convert Mongoose document to plain object if needed
            if (getDetail.toObject) {
                getDetail = getDetail.toObject();
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getDetail;
            responseData.result = getDetail; // Also include in result for backward compatibility

            console.log('Sending response:', responseData);
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOneBYUsername: async (req, res) => {
        let username = req.params.username;
        let responseData = {};
        try {
            console.log('Fetching user by username:', username);
            let getDetail = await userDbHandler.getOneByQuery({ username: username }, { password: 0 });

            console.log('User fetch result:', getDetail);

            if (!getDetail) {
                responseData.msg = 'User not found with this username';
                return responseHelper.error(res, responseData);
            }

            // Convert Mongoose document to plain object if needed
            if (getDetail.toObject) {
                getDetail = getDetail.toObject();
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getDetail;
            responseData.result = getDetail; // Also include in result for backward compatibility

            console.log('Sending response:', responseData);
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    update: async (req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for Admin User update:', reqObj);
        let responseData = {};
        try {
            let query = { _id: { $ne: reqObj.id } };
            if (config.loginByType == 'email') {
                query.username = reqObj?.email.toLowerCase();
            }
            else if (config.loginByType == 'address') {
                query.username = reqObj?.address.toLowerCase();
            }
            else {
                query.username = reqObj?.username;
            }
            let checkUsername = await userDbHandler.getByQuery(query);
            let checkEmail = await userDbHandler.getByQuery({ _id: { $ne: reqObj.id }, email: reqObj?.email });
            let checkPhoneNumber = await userDbHandler.getByQuery({ _id: { $ne: reqObj.id }, phone_number: reqObj?.phone_number });

            if (checkUsername.length) {
                responseData.msg = `${config.loginByName} Already Exist !`;
                return responseHelper.error(res, responseData);
            }
            if (reqObj?.email && checkEmail.length >= config.emailCheck) {
                responseData.msg = 'Email Already Exist !';
                return responseHelper.error(res, responseData);
            }
            if (reqObj?.phone_number && checkPhoneNumber.length >= config.phoneCheck) {
                responseData.msg = 'Phone Number Already Exist !';
                return responseHelper.error(res, responseData);
            }
            if (reqObj?.email) {
                reqObj.email = reqObj.email.toLowerCase();
            }
            let userData = await userDbHandler.getById(reqObj.id, { password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user!';
                return responseHelper.error(res, responseData);
            }

            let updatedObj = {
                name: reqObj.name,
                phone_number: reqObj?.phone_number,
            }

            if (reqObj.email != undefined && reqObj.email) {
                updatedObj.email = reqObj?.email
            }

            if (reqObj.username != undefined && reqObj.username) {
                updatedObj.username = reqObj?.username
            }

            if (reqObj.address != undefined && reqObj.address) {
                updatedObj.address = reqObj?.address
            }

            if (reqObj.reward != undefined && reqObj.reward) {
                updatedObj.reward = reqObj?.reward
            }

            if (reqObj.extra != undefined && reqObj.extra) {
                updatedObj.extra = reqObj?.extra
            }

            if (reqObj.status !== undefined) {
                updatedObj.status = reqObj.status;
            }

            // Handle wallet updates if provided
            if (reqObj.wallet !== undefined) {
                updatedObj.wallet = parseFloat(reqObj.wallet) || 0;
            }

            if (reqObj.wallet_topup !== undefined) {
                updatedObj.wallet_topup = parseFloat(reqObj.wallet_topup) || 0;
            }

            if (reqObj.password) {
                updatedObj.password = await _createHashPassword(reqObj.password);
            }

            try {
                const updatedUser = await userDbHandler.updateById(reqObj.id, updatedObj);

                if (!updatedUser) {
                    responseData.msg = 'Failed to update user data';
                    return responseHelper.error(res, responseData);
                }

                responseData.msg = `Data updated successfully!`;
                responseData.data = {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    phone_number: updatedUser.phone_number,
                    status: updatedUser.status,
                    wallet: updatedUser.wallet,
                    wallet_topup: updatedUser.wallet_topup
                };
                return responseHelper.success(res, responseData);
            } catch (updateError) {
                log.error('Failed to update user in database with error::', updateError);
                responseData.msg = 'Database error while updating user';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('failed to update user with error::', error);
            responseData.msg = 'Failed to update user';
            return responseHelper.error(res, responseData);
        }
    },

    updateLastInvestmentAmounts: async (req, res) => {
        let responseData = {};
        try {
            // Import the Investment model
            const Investment = require('../../models/investment.model');
            const User = require('../../models/user.model');

            console.log('Starting update of last_investment_amount for all users...');

            // Get all users
            const users = await User.find({});
            console.log(`Found ${users.length} users to process`);

            let updatedCount = 0;

            // Process each user
            for (const user of users) {
                // Find the latest investment for this user
                const latestInvestment = await Investment.findOne(
                    {
                        user_id: user._id,
                        status: { $in: ['active', 1, 2] }, // Include active investments
                        package_type: 'trading' // Only consider trading packages
                    }
                ).sort({ created_at: -1 }); // Sort by creation date, newest first

                if (latestInvestment) {
                    console.log(`User ${user.username || user._id}: Found latest investment of $${latestInvestment.amount}`);

                    // Update the user's last_investment_amount
                    await User.updateOne(
                        { _id: user._id },
                        { $set: { last_investment_amount: latestInvestment.amount } }
                    );

                    updatedCount++;
                } else {
                    console.log(`User ${user.username || user._id}: No investments found`);
                }
            }

            responseData.msg = `Updated last_investment_amount for ${updatedCount} users`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Error updating last_investment_amount:', error);
            responseData.msg = 'Failed to update last investment amounts';
            return responseHelper.error(res, responseData);
        }
    },

    searchUsers: async (req, res) => {
        let responseData = {};
        try {
            const { query } = req.query;

            if (!query || query.length < 2) {
                responseData.msg = 'Search query must be at least 2 characters';
                return responseHelper.error(res, responseData);
            }

            // Search for users by username, name, email, or sponsorID
            const users = await userDbHandler.getByQuery(
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { sponsorID: { $regex: query, $options: 'i' } }
                    ]
                },
                {
                    _id: 1,
                    username: 1,
                    name: 1,
                    email: 1,
                    wallet: 1,
                    wallet_topup: 1,
                    sponsorID: 1,
                    total_investment: 1,
                    is_blocked: 1,
                    block_reason: 1,
                    two_fa_enabled: 1,
                    two_fa_method: 1
                }
            );

            responseData.msg = `Found ${users.length} users matching '${query}'`;
            responseData.data = users;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to search users with error:', error);
            responseData.msg = 'Failed to search users';
            return responseHelper.error(res, responseData);
        }
    },

    getUserByEmail: async (req, res) => {
        let email = req.params.email;
        let responseData = {};
        try {
            console.log('Searching for user with email:', email);

            // Find user by email (case insensitive)
            let user = await userDbHandler.getOneByQuery(
                { email: { $regex: new RegExp('^' + email + '$', 'i') } },
                { password: 0 }
            );

            console.log('User search result:', user);

            if (!user) {
                responseData.msg = 'User not found with this email';
                return responseHelper.error(res, responseData);
            }

            // Convert Mongoose document to plain object if needed
            if (user.toObject) {
                user = user.toObject();
            }

            responseData.msg = 'User found successfully';
            responseData.data = user; // Use data field for consistency
            responseData.result = user; // Also include in result for backward compatibility

            console.log('Sending response:', responseData);
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch user by email with error:', error);
            responseData.msg = 'Failed to fetch user';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Block a user
     */
    blockUser: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request to block user:', reqObj);
        let responseData = {};

        try {
            // Check if user exists
            let userData = await userDbHandler.getById(reqObj.id);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if user is already blocked
            if (userData.is_blocked) {
                responseData.msg = 'User is already blocked';
                return responseHelper.error(res, responseData);
            }

            // Update user to blocked status
            const updatedObj = {
                is_blocked: true,
                block_reason: reqObj.block_reason || 'Blocked by administrator',
                force_relogin_time: new Date().getTime(),
                force_relogin_type: 'admin_forced_logout'
            };

            await userDbHandler.updateById(reqObj.id, updatedObj);

            responseData.msg = 'User has been blocked successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to block user with error:', error);
            responseData.msg = 'Failed to block user';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Unblock a user
     */
    unblockUser: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request to unblock user:', reqObj);
        let responseData = {};

        try {
            // Check if user exists
            let userData = await userDbHandler.getById(reqObj.id);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if user is already unblocked
            if (!userData.is_blocked) {
                responseData.msg = 'User is not blocked';
                return responseHelper.error(res, responseData);
            }

            // Update user to unblocked status
            const updatedObj = {
                is_blocked: false,
                block_reason: ''
            };

            await userDbHandler.updateById(reqObj.id, updatedObj);

            responseData.msg = 'User has been unblocked successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to unblock user with error:', error);
            responseData.msg = 'Failed to unblock user';
            return responseHelper.error(res, responseData);
        }
    },

    // Toggle user's 2FA status by admin
    toggle2FA: async (req, res) => {
        let responseData = {};
        try {
            const { userId, enabled } = req.body;

            if (!userId) {
                responseData.msg = 'User ID is required';
                return responseHelper.error(res, responseData);
            }

            if (typeof enabled !== 'boolean') {
                responseData.msg = 'Enabled status must be a boolean value';
                return responseHelper.error(res, responseData);
            }

            // Get user by ID
            const user = await userDbHandler.getById(userId);
            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Update 2FA status
            const updateData = {
                two_fa_enabled: enabled
            };

            if (enabled) {
                // If enabling 2FA, set to email OTP method (otpless) by default
                updateData.two_fa_method = "otpless";
                // Clear any existing TOTP secret since we're using email OTP
                updateData.two_fa_secret = "";
            } else {
                // If disabling 2FA, clear everything and reset to default
                updateData.two_fa_secret = "";
                updateData.two_fa_method = "otpless";
                // Also clear any OTPless related fields
                updateData.otpless_enabled = false;
                updateData.otpless_request_id = "";
                updateData.otpless_verified = false;
            }

            await userDbHandler.updateById(userId, updateData);

            // Get updated user data
            const updatedUser = await userDbHandler.getById(userId, {
                _id: 1,
                username: 1,
                name: 1,
                email: 1,
                two_fa_enabled: 1,
                two_fa_method: 1
            });

            responseData.msg = enabled
                ? `2FA enabled with Email OTP method for user ${user.name || user.username}`
                : `2FA disabled and all methods cleared for user ${user.name || user.username}`;
            responseData.data = updatedUser;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to toggle user 2FA with error::', error);
            responseData.msg = 'Failed to toggle 2FA status';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get investment summary for all users
     * Returns: [{ _id, username, email, self_investment, direct_business }]
     */
    getInvestmentSummary: async (req, res) => {
        const responseData = {};
        try {
            const User = require('../../models/user.model');
            const Investment = require('../../models/investment.model');
            const RewardMaster = require('../../models/reward.master.model');

            // Get all users
            const users = await User.find({}, '_id username email');

            // Get all investments in one go
            const allInvestments = await Investment.find({}, 'user_id amount');

            // Build a map of userId => total self investment
            const selfInvestMap = {};
            allInvestments.forEach(inv => {
                const uid = inv.user_id.toString();
                selfInvestMap[uid] = (selfInvestMap[uid] || 0) + (inv.amount || 0);
            });

            // Build a map of sponsorId => [referral userIds]
            const userIdToSponsor = {};
            const sponsorToReferrals = {};
            const allUsers = await User.find({}, '_id refer_id');
            allUsers.forEach(u => {
                userIdToSponsor[u._id.toString()] = u.refer_id ? u.refer_id.toString() : null;
                if (u.refer_id) {
                    const sid = u.refer_id.toString();
                    if (!sponsorToReferrals[sid]) sponsorToReferrals[sid] = [];
                    sponsorToReferrals[sid].push(u._id.toString());
                }
            });

            // Fetch all reward masters
            const rewardMasters = await RewardMaster.find({ active: true });

            // For each user, sum investments of their direct referrals and calculate eligible rewards
            const data = users.map(user => {
                const uid = user._id.toString();
                // Self investment
                const self_investment = selfInvestMap[uid] || 0;
                // Direct business: sum of investments by direct referrals
                let direct_business = 0;
                const referrals = sponsorToReferrals[uid] || [];
                referrals.forEach(refId => {
                    direct_business += selfInvestMap[refId] || 0;
                });
                // Calculate eligible rewards
                const eligibleRewards = rewardMasters
                  .filter(rm =>
                    (self_investment >= rm.self_invest_target) ||
                    (direct_business >= rm.direct_business_target)
                  )
                  .map(rm => ({
                    reward_id: rm._id,
                    reward_name: rm.reward_name,
                    reward_value: rm.reward_value
                  }));
                return {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    self_investment,
                    direct_business,
                    eligibleRewards
                };
            });

            responseData.msg = 'Investment summary fetched successfully!';
            responseData.data = data;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch investment summary:', error);
            responseData.msg = 'Failed to fetch investment summary';
            return responseHelper.error(res, responseData);
        }
    },

};