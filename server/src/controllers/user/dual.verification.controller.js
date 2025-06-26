'use strict';
const logger = require('../../services/logger');
const log = new logger('DualVerificationController').getChildLogger();
const { userDbHandler } = require('../../services/db');
const otplessService = require('../../services/otpless.service');
const responseHelper = require('../../utils/customResponse');
const jwtService = require('../../services/jwt');

/**
 * Dual Verification Controller for handling email + mobile verification during registration
 */
const dualVerificationController = {
    /**
     * Send OTP to both email and mobile for registration
     */
    sendRegistrationOTPs: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for dual registration OTPs:', { 
            email: reqObj.email, 
            phone_number: reqObj.phone_number 
        });
        let responseData = {};

        try {
            const { email, phone_number } = reqObj;

            // Validate email and phone
            if (!email || !email.includes('@')) {
                responseData.msg = 'Valid email is required';
                return responseHelper.error(res, responseData);
            }

            if (!phone_number) {
                responseData.msg = 'Valid phone number is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone_number.trim();

            // Check if user already exists with email or phone
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if (existingUserByEmail && existingUserByEmail.length > 0) {
                responseData.msg = 'Email already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            if (existingUserByPhone && existingUserByPhone.length > 0) {
                responseData.msg = 'Phone number already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            log.info('Sending registration OTPs to email and mobile:', { 
                email: normalizedEmail, 
                phone: normalizedPhone 
            });

            // Send OTP to email
            const emailOtpResult = await otplessService.sendRegistrationOTP(normalizedEmail);

            // Send OTP to mobile
            const mobileOtpResult = await otplessService.sendRegistrationSMSOTP(normalizedPhone);

            // Check if both OTPs are disabled
            if (emailOtpResult.disabled && mobileOtpResult.disabled) {
                log.info('Both email and mobile OTP are disabled, returning disabled status');
                responseData.msg = 'OTP verification is currently disabled. Registration can proceed without OTP verification.';
                responseData.data = {
                    email: normalizedEmail,
                    phone_number: normalizedPhone,
                    otp_disabled: true,
                    email_otp_disabled: true,
                    mobile_otp_disabled: true
                };
                log.info('Sending disabled OTP response:', responseData);
                return responseHelper.success(res, responseData);
            }

            // Check if only mobile OTP is disabled (email OTP enabled)
            if (!emailOtpResult.disabled && mobileOtpResult.disabled) {
                log.info('Mobile OTP is disabled, only email OTP will be used');
                responseData.msg = 'Email verification code sent successfully. Mobile verification is disabled.';
                responseData.data = {
                    emailRequestId: emailOtpResult.requestId,
                    email: normalizedEmail,
                    phone_number: normalizedPhone,
                    email_only: true,
                    mobile_otp_disabled: true
                };
                return responseHelper.success(res, responseData);
            }

            // Check if only email OTP is disabled (mobile OTP enabled)
            if (emailOtpResult.disabled && !mobileOtpResult.disabled) {
                log.info('Email OTP is disabled, only mobile OTP will be used');
                responseData.msg = 'Mobile verification code sent successfully. Email verification is disabled.';
                responseData.data = {
                    mobileRequestId: mobileOtpResult.requestId,
                    email: normalizedEmail,
                    phone_number: normalizedPhone,
                    mobile_only: true,
                    email_otp_disabled: true
                };
                return responseHelper.success(res, responseData);
            }

            // Check if both OTPs were sent successfully
            if (emailOtpResult.success && mobileOtpResult.success) {
                const smsService = mobileOtpResult.service || 'Unknown';
                const isTestService = smsService === 'Fallback-Test';

                responseData.msg = isTestService
                    ? 'Email OTP sent successfully. Mobile OTP is in test mode - check server logs.'
                    : 'OTPs sent successfully to both email and mobile';

                responseData.data = {
                    emailRequestId: emailOtpResult.requestId,
                    mobileRequestId: mobileOtpResult.requestId,
                    email: normalizedEmail,
                    phone_number: normalizedPhone,
                    smsService: smsService,
                    isTestMode: isTestService
                };

                log.info('Both registration OTPs sent successfully:', {
                    email: normalizedEmail,
                    emailRequestId: emailOtpResult.requestId,
                    phone: normalizedPhone,
                    mobileRequestId: mobileOtpResult.requestId,
                    smsService: smsService,
                    isTestMode: isTestService
                });

                return responseHelper.success(res, responseData);
            } else {
                // Handle partial success or complete failure
                let errorMessages = [];
                let hasDisabled = false;

                if (!emailOtpResult.success) {
                    if (emailOtpResult.disabled) {
                        errorMessages.push(`Email OTP is disabled`);
                        hasDisabled = true;
                    } else {
                        errorMessages.push(`Email OTP: ${emailOtpResult.error}`);
                    }
                }
                if (!mobileOtpResult.success) {
                    if (mobileOtpResult.disabled) {
                        errorMessages.push(`Mobile OTP is disabled`);
                        hasDisabled = true;
                    } else {
                        errorMessages.push(`Mobile OTP: ${mobileOtpResult.error}`);
                    }
                }

                // If any OTP is disabled, return appropriate response
                if (hasDisabled) {
                    responseData.msg = 'Some OTP services are disabled: ' + errorMessages.join(', ');
                    responseData.data = {
                        email: normalizedEmail,
                        phone_number: normalizedPhone,
                        otp_disabled: true,
                        email_otp_disabled: emailOtpResult.disabled || false,
                        mobile_otp_disabled: mobileOtpResult.disabled || false,
                        partial_disabled: true
                    };
                    return responseHelper.success(res, responseData);
                }

                responseData.msg = 'Failed to send OTPs: ' + errorMessages.join(', ');
                responseData.details = {
                    emailResult: emailOtpResult,
                    mobileResult: mobileOtpResult
                };
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send dual registration OTPs:', error);
            responseData.msg = 'Failed to send OTPs. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify both email and mobile OTPs and create user
     */
    verifyRegistrationOTPs: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for dual registration OTP verification:', {
            email: reqObj.email,
            phone_number: reqObj.phone_number,
            emailRequestId: reqObj.emailRequestId,
            mobileRequestId: reqObj.mobileRequestId,
            hasUserData: !!reqObj.userData
        });
        let responseData = {};

        try {
            const { 
                email, 
                phone_number, 
                emailOtp, 
                mobileOtp, 
                emailRequestId, 
                mobileRequestId, 
                userData 
            } = reqObj;

            // Validate required fields
            if (!email || !phone_number || !emailOtp || !mobileOtp || 
                !emailRequestId || !mobileRequestId || !userData) {
                responseData.msg = 'All fields are required: email, phone_number, emailOtp, mobileOtp, emailRequestId, mobileRequestId, and userData';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone_number.trim();

            log.info('Verifying dual registration OTPs:', {
                email: normalizedEmail,
                phone: normalizedPhone,
                emailRequestId,
                mobileRequestId,
                emailOtpLength: emailOtp.length,
                mobileOtpLength: mobileOtp.length
            });

            // Verify email OTP
            const emailVerificationResult = await otplessService.verifyRegistrationOTP(emailOtp, emailRequestId);
            
            // Verify mobile OTP
            const mobileVerificationResult = await otplessService.verifyRegistrationSMSOTP(mobileOtp, mobileRequestId);

            log.info('OTP verification results:', {
                emailVerified: emailVerificationResult.success && emailVerificationResult.isVerified,
                mobileVerified: mobileVerificationResult.success && mobileVerificationResult.isVerified
            });

            // Check if both OTPs are verified
            if ((!emailVerificationResult.success || !emailVerificationResult.isVerified) ||
                (!mobileVerificationResult.success || !mobileVerificationResult.isVerified)) {
                
                let errorMessages = [];
                if (!emailVerificationResult.success || !emailVerificationResult.isVerified) {
                    errorMessages.push(`Email OTP: ${emailVerificationResult.error || 'Invalid or expired'}`);
                }
                if (!mobileVerificationResult.success || !mobileVerificationResult.isVerified) {
                    errorMessages.push(`Mobile OTP: ${mobileVerificationResult.error || 'Invalid or expired'}`);
                }

                responseData.msg = 'OTP verification failed: ' + errorMessages.join(', ');
                return responseHelper.error(res, responseData);
            }

            // Check if user already exists (double check)
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if ((existingUserByEmail && existingUserByEmail.length > 0) || 
                (existingUserByPhone && existingUserByPhone.length > 0)) {
                responseData.msg = 'Email or phone number already registered';
                return responseHelper.error(res, responseData);
            }

            // Handle referral system (matching existing auth controller logic)
            let trace_id = userData.referrer || userData.referralId;
            let refer_id = null;

            // If a valid referral ID is provided, find the referring user
            if (trace_id) {
                // First check if it's a sponsor ID
                if (trace_id.startsWith('NB') || trace_id.startsWith('SI')) {
                    let sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: trace_id }, { _id: 1 });
                    if (sponsorUser) {
                        refer_id = sponsorUser._id;
                    }
                }

                // If not a sponsor ID or sponsor ID not found, check username
                if (!refer_id) {
                    let referUser = await userDbHandler.getOneByQuery({ username: trace_id }, { _id: 1 });
                    if (referUser) {
                        refer_id = referUser._id;
                    }
                }

                // If still not found, check if it's 'admin'
                if (!refer_id && trace_id === 'admin') {
                    const adminUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                    if (adminUser) {
                        refer_id = adminUser._id;
                    }
                }

                // If no valid refer_id found, return error
                if (!refer_id) {
                    responseData.msg = 'Invalid referral ID!';
                    return responseHelper.error(res, responseData);
                }
            }

            // If no referral ID is provided, assign default refer_id and generate a trace_id
            if (!trace_id) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                refer_id = defaultUser ? defaultUser._id : null;
                if (!refer_id) {
                    responseData.msg = 'Default referral setup missing!';
                    return responseHelper.error(res, responseData);
                }

                // Generate a unique trace_id
                const generateTraceId = () => {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let traceId = 'ROB';
                    for (let i = 0; i < 5; i++) {
                        traceId += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    return traceId;
                };

                trace_id = generateTraceId();
                while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
                    trace_id = generateTraceId(); // Ensure uniqueness
                }
            }

            // Get placement ID using the hardcoded admin ID
            const { getPlacementId } = require('../../services/commonFun');
            let placement_id = await getPlacementId("678f9a82a2dac325900fc47e", 3); // 3x matrix
            if (!placement_id) {
                responseData.msg = 'No placement available!';
                return responseHelper.error(res, responseData);
            }

            // Generate a unique sponsor ID
            const generateSponsorId = async () => {
                const prefix = 'NB';
                let isUnique = false;
                let sponsorId = '';

                while (!isUnique) {
                    const randomNum = Math.floor(10000 + Math.random() * 90000);
                    sponsorId = `${prefix}${randomNum}`;
                    const existingUser = await userDbHandler.getOneByQuery({ sponsorID: sponsorId });
                    if (!existingUser) {
                        isUnique = true;
                    }
                }
                return sponsorId;
            };

            const sponsorID = await generateSponsorId();

            // Create user with dual verification
            const newUserData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: userData.username || normalizedEmail, // Use email as username if not provided
                trace_id: trace_id,
                sponsorID: sponsorID,
                email: normalizedEmail,
                phone_number: normalizedPhone,
                password: userData.password, // Password will be encrypted by the pre-save hook
                name: userData.name,
                country: userData.country,
                email_verified: true,
                phone_verified: true,
                mobile_otp_verified: true,
                otpless_enabled: true,
                otpless_verified: true,
                two_fa_method: 'otpless'
            };

            log.info('Creating new user with dual verification:', {
                email: newUserData.email,
                phone: newUserData.phone_number,
                username: newUserData.username,
                sponsorID: newUserData.sponsorID,
                trace_id: newUserData.trace_id
            });

            const newUser = await userDbHandler.create(newUserData);
            log.info('User created successfully with dual verification:', newUser._id);

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, newUserData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
                // Don't fail registration if notification creation fails
            }

            responseData.msg = 'Registration completed successfully with email and mobile verification';
            responseData.data = {
                userId: newUser._id,
                email: newUser.email,
                phone_number: newUser.phone_number,
                username: newUser.username,
                sponsorID: newUser.sponsorID
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify dual registration OTPs:', error);
            responseData.msg = 'Failed to verify OTPs. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Direct registration without OTP when OTP is disabled
     */
    registerWithoutOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for direct registration without OTP:', {
            email: reqObj.email,
            phone_number: reqObj.phone_number,
            hasUserData: !!reqObj.userData
        });
        let responseData = {};

        try {
            const { email, phone_number, userData } = reqObj;

            // Validate required fields
            if (!email || !phone_number || !userData) {
                responseData.msg = 'Email, phone_number, and userData are required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone_number.trim();

            // Check if user already exists
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if (existingUserByEmail && existingUserByEmail.length > 0) {
                responseData.msg = 'Email already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            if (existingUserByPhone && existingUserByPhone.length > 0) {
                responseData.msg = 'Phone number already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            // Handle referral system (same logic as OTP verification)
            let trace_id = userData.referrer || userData.referralId;
            let refer_id = null;

            if (trace_id) {
                // Check if it's a sponsor ID
                if (trace_id.startsWith('NB') || trace_id.startsWith('SI')) {
                    let sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: trace_id }, { _id: 1 });
                    if (sponsorUser) {
                        refer_id = sponsorUser._id;
                    }
                }

                // If not a sponsor ID or sponsor ID not found, check username
                if (!refer_id) {
                    let referUser = await userDbHandler.getOneByQuery({ username: trace_id }, { _id: 1 });
                    if (referUser) {
                        refer_id = referUser._id;
                    }
                }

                // If still not found, check if it's 'admin'
                if (!refer_id && trace_id === 'admin') {
                    const adminUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                    if (adminUser) {
                        refer_id = adminUser._id;
                    }
                }

                // If no valid refer_id found, return error
                if (!refer_id) {
                    responseData.msg = 'Invalid referral ID!';
                    return responseHelper.error(res, responseData);
                }
            }

            // If no referral ID is provided, assign default refer_id
            if (!trace_id) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                refer_id = defaultUser ? defaultUser._id : null;
                if (!refer_id) {
                    responseData.msg = 'Default referral setup missing!';
                    return responseHelper.error(res, responseData);
                }

                // Generate a unique trace_id
                const generateTraceId = () => {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let traceId = 'ROB';
                    for (let i = 0; i < 5; i++) {
                        traceId += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    return traceId;
                };

                trace_id = generateTraceId();
                while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
                    trace_id = generateTraceId();
                }
            }

            // Get placement ID - use refer_id as placement_id for simplicity
            let placement_id = refer_id;

            // Generate a unique sponsor ID
            const generateSponsorId = async () => {
                const prefix = 'NB';
                let isUnique = false;
                let sponsorId = '';

                while (!isUnique) {
                    const randomNum = Math.floor(10000 + Math.random() * 90000);
                    sponsorId = `${prefix}${randomNum}`;
                    const existingUser = await userDbHandler.getOneByQuery({ sponsorID: sponsorId });
                    if (!existingUser) {
                        isUnique = true;
                    }
                }
                return sponsorId;
            };

            const sponsorID = await generateSponsorId();

            // Validate password is provided
            if (!userData.password) {
                responseData.msg = 'Password is required';
                return responseHelper.error(res, responseData);
            }

            // Create user without OTP verification
            const newUserData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: userData.username || normalizedEmail,
                trace_id: trace_id,
                sponsorID: sponsorID,
                email: normalizedEmail,
                phone_number: normalizedPhone,
                password: userData.password, // Will be encrypted by pre-save hook
                name: userData.name,
                country: userData.country,
                email_verified: true, // Mark as verified since OTP is disabled
                phone_verified: true, // Mark as verified since OTP is disabled
                mobile_otp_verified: true,
                otpless_enabled: false, // OTP is disabled
                otpless_verified: true, // Skip verification
                two_fa_method: 'otpless'
            };

            log.info('Creating new user without OTP verification:', {
                email: newUserData.email,
                phone: newUserData.phone_number,
                username: newUserData.username,
                sponsorID: newUserData.sponsorID,
                trace_id: newUserData.trace_id
            });

            const newUser = await userDbHandler.create(newUserData);
            log.info('User created successfully without OTP verification:', newUser._id);

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, newUserData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
            }

            responseData.msg = 'Registration completed successfully without OTP verification';
            responseData.data = {
                userId: newUser._id,
                email: newUser.email,
                phone_number: newUser.phone_number,
                username: newUser.username,
                sponsorID: newUser.sponsorID,
                password: userData.password // Return the user provided password
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to register user without OTP:', error);
            responseData.msg = 'Failed to register user. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    }
};

module.exports = dualVerificationController;
