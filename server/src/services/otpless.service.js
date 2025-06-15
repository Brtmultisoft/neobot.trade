'use strict';
const axios = require('axios');
const logger = require('./logger');
const log = new logger('OTPlessService').getChildLogger();
const emailOTPService = require('./email-otp.service');
const smsOTPService = require('./sms-otp.service');
const otpSettingsService = require('./otp-settings.service');

/**
 * OTPless Service for handling OTP operations
 */
class OTPlessService {
    constructor() {
        this.apiUrl = 'https://auth.otpless.app/auth/v1';
        this.clientId = process.env.OTPLESS_CLIENT_ID;
        this.clientSecret = process.env.OTPLESS_CLIENT_SECRET;

        // Log configuration for debugging
        log.info('OTPless Service initialized', {
            clientId: this.clientId,
            clientSecret: this.clientSecret ? '***' + this.clientSecret.slice(-4) : 'Not set',
            apiUrl: this.apiUrl
        });

        // Validate configuration
        if (!this.clientId || !this.clientSecret) {
            log.error('OTPless configuration missing - clientId or clientSecret not provided');
        }
    }

    /**
     * Send OTP to email - Based on PHP implementation from text file
     * @param {string} email - Email address to send OTP
     * @param {number} otpLength - Length of OTP (4 or 6)
     * @param {number} expiry - OTP expiry time in seconds
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendOTP(email, otpLength = 4, expiry = 120) {
        console.log("Hitting OTPless API...");

        try {
            log.info(`Sending OTP to email: ${email}`, { otpLength, expiry });

            // Validate configuration
            if (!this.clientId || !this.clientSecret) {
                throw new Error('OTPless configuration missing - clientId or clientSecret not provided');
            }

            // Validate email
            if (!email || !email.includes('@')) {
                throw new Error('Invalid email address');
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            // Based on PHP implementation from text file - exact format
            const data = {
                email: normalizedEmail,
                expiry: expiry,
                otpLength: otpLength,
                channels: ['EMAIL']  // Array format as in PHP
            };

            log.info('Sending OTP request data:', data);
            log.info('Using headers:', {
                clientId: this.clientId,
                clientSecret: this.clientSecret ? '***' + this.clientSecret.slice(-4) : 'Not set'
            });

            // Use the exact endpoint from PHP implementation
            const response = await axios.post(`${this.apiUrl}/initiate/otp`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'clientId': this.clientId,
                    'clientSecret': this.clientSecret
                },
                timeout: 30000
            });

            log.info('OTP API response status:', response.status);
            log.info('OTP API response data:', response.data);

            // Check for requestId as in PHP implementation
            if (response.data && response.data.requestId) {
                log.info('OTP sent successfully', { email: normalizedEmail, requestId: response.data.requestId });

                return {
                    success: true,
                    requestId: response.data.requestId,
                    message: 'OTP sent successfully to your email!'
                };
            } else {
                log.error('No requestId in response:', response.data);
                return {
                    success: false,
                    error: 'Failed to send OTP: ' + JSON.stringify(response.data),
                    details: response.data
                };
            }

        } catch (error) {
            log.error('OTPless API failed, trying email fallback:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                email: email
            });

            // Fallback to email OTP service
            log.info('Using email OTP fallback service');
            try {
                const fallbackResult = await emailOTPService.sendOTP(email, otpLength, expiry);
                if (fallbackResult.success) {
                    log.info('Email OTP fallback successful');
                    return fallbackResult;
                }
            } catch (fallbackError) {
                log.error('Email OTP fallback also failed:', fallbackError);
            }

            let errorMessage = 'Failed to send OTP';

            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed - Invalid OTPless credentials';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request parameters';
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded - Please try again later';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
                details: error.response?.data,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Send OTP to mobile number - SMS OTP
     * @param {string} phoneNumber - Phone number to send OTP (with country code)
     * @param {number} otpLength - Length of OTP (4 or 6)
     * @param {number} expiry - OTP expiry time in seconds
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendSMSOTP(phoneNumber, otpLength = 4, expiry = 120) {
        console.log("Hitting OTPless SMS API...");

        try {
            log.info(`Sending SMS OTP to phone: ${phoneNumber}`, { otpLength, expiry });

            // Validate configuration
            if (!this.clientId || !this.clientSecret) {
                throw new Error('OTPless configuration missing - clientId or clientSecret not provided');
            }

            // Validate phone number
            if (!phoneNumber) {
                throw new Error('Phone number is required');
            }

            // Normalize phone number - ensure proper format for OTPless API
            let normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');

            // OTPless expects phone numbers WITHOUT the '+' sign, just country code + number
            // Remove '+' if present
            if (normalizedPhone.startsWith('+')) {
                normalizedPhone = normalizedPhone.substring(1);
            }

            // If no country code provided, determine based on number length and pattern
            if (normalizedPhone.length === 10) {
                // Check if it looks like an Indian number (starts with 6-9)
                if (/^[6-9]/.test(normalizedPhone)) {
                    normalizedPhone = '91' + normalizedPhone; // India - OTPless format
                } else {
                    normalizedPhone = '1' + normalizedPhone; // US/Canada - OTPless format
                }
            } else if (normalizedPhone.length === 11) {
                // Already has country code, keep as is
                if (normalizedPhone.startsWith('1')) {
                    // US/Canada number
                } else if (normalizedPhone.startsWith('91')) {
                    // Indian number
                } else {
                    // Default to India for 10-digit numbers starting with 6-9, otherwise US
                    const lastTenDigits = normalizedPhone.substring(1);
                    if (lastTenDigits.length === 10 && /^[6-9]/.test(lastTenDigits)) {
                        normalizedPhone = '91' + lastTenDigits;
                    } else {
                        normalizedPhone = '1' + lastTenDigits;
                    }
                }
            } else if (normalizedPhone.length === 12) {
                // Already properly formatted (country code + 10 digits)
            } else {
                // Default formatting for other cases
                if (normalizedPhone.length >= 10) {
                    const lastTenDigits = normalizedPhone.substring(-10);
                    if (/^[6-9]/.test(lastTenDigits)) {
                        normalizedPhone = '91' + lastTenDigits;
                    } else {
                        normalizedPhone = '1' + lastTenDigits;
                    }
                }
            }

            // Validate phone number format for OTPless (country code + number, no '+')
            if (normalizedPhone.length < 11 || normalizedPhone.length > 15) {
                throw new Error('Invalid phone number format. Expected format: country code + number (e.g., 917367989866)');
            }

            // Validate that it contains only digits
            if (!/^\d+$/.test(normalizedPhone)) {
                throw new Error('Phone number should contain only digits after normalization');
            }

            // Based on OTPless API documentation for SMS
            // Use the same format as email but with SMS channel
            const data = {
                phoneNumber: normalizedPhone,
                expiry: expiry,
                otpLength: otpLength,
                channels: ['SMS']  // Array format like email
            };

            log.info('Sending SMS OTP request data:', {
                phoneNumber: normalizedPhone,
                otpLength,
                expiry,
                channels: data.channels,
                apiUrl: this.apiUrl,
                hasClientId: !!this.clientId,
                hasClientSecret: !!this.clientSecret
            });

            console.log('📱 SENDING SMS OTP TO:', normalizedPhone);
            log.info('Attempting to send SMS OTP via OTPless API', {
                phoneNumber: normalizedPhone,
                apiUrl: this.apiUrl,
                hasCredentials: !!(this.clientId && this.clientSecret)
            });

            let response;
            let lastError;

            // Try multiple approaches for SMS OTP
            const approaches = [
                // Approach 1: Same endpoint with SMS channel
                {
                    url: `${this.apiUrl}/initiate/otp`,
                    data: data,
                    name: 'Standard SMS endpoint'
                },
                // Approach 2: Try with different API URL structure
                {
                    url: `${this.apiUrl}/initiate/sms`,
                    data: data,
                    name: 'SMS-specific endpoint'
                },
                // Approach 3: Try with phone instead of phoneNumber
                {
                    url: `${this.apiUrl}/initiate/otp`,
                    data: { ...data, phone: data.phoneNumber, phoneNumber: undefined },
                    name: 'Alternative phone field'
                }
            ];

            for (const approach of approaches) {
                try {
                    console.log(`🔄 Trying ${approach.name}:`, approach.url);

                    response = await axios.post(approach.url, approach.data, {
                        headers: {
                            'Content-Type': 'application/json',
                            'clientId': this.clientId,
                            'clientSecret': this.clientSecret
                        },
                        timeout: 30000
                    });

                    console.log(`✅ ${approach.name} succeeded!`);
                    break; // Success, exit loop

                } catch (error) {
                    console.log(`❌ ${approach.name} failed:`, error.response?.status, error.response?.data?.message || error.message);
                    lastError = error;
                    continue; // Try next approach
                }
            }

            // If all approaches failed, throw the last error
            if (!response) {
                throw lastError || new Error('All SMS OTP approaches failed');
            }

            log.info('SMS OTP API response status:', response.status);
            log.info('SMS OTP API response data:', response.data);

            // Check for requestId
            if (response.data && response.data.requestId) {
                console.log('✅ SMS OTP SENT SUCCESSFULLY TO:', normalizedPhone);
                log.info('SMS OTP sent successfully via OTPless API', {
                    phoneNumber: normalizedPhone,
                    requestId: response.data.requestId,
                    service: 'OTPless'
                });

                return {
                    success: true,
                    requestId: response.data.requestId,
                    message: 'OTP sent successfully to your mobile number!',
                    phoneNumber: normalizedPhone,
                    service: 'OTPless'
                };
            } else {
                console.log('❌ SMS OTP FAILED - No requestId in response');
                log.error('No requestId in SMS response:', response.data);
                return {
                    success: false,
                    error: 'Failed to send SMS OTP: ' + (response.data?.message || JSON.stringify(response.data)),
                    details: response.data
                };
            }

        } catch (error) {
            console.log('❌ OTPless SMS API FAILED!');
            console.log('📱 Phone Number:', phoneNumber, '→', normalizedPhone);
            console.log('🔴 Error Status:', error.response?.status);
            console.log('🔴 Error Message:', error.message);
            console.log('🔴 Error Response:', error.response?.data);

            log.error('OTPless SMS API failed, trying SMS fallback:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                originalPhone: phoneNumber,
                normalizedPhone: normalizedPhone
            });

            // Fallback to SMS OTP service
            console.log('🔄 FALLING BACK TO TEST SMS SERVICE (OTP will be logged to console)');
            log.info('Using SMS OTP fallback service - OTP will be logged for testing');
            try {
                const fallbackResult = await smsOTPService.sendOTP(phoneNumber, otpLength, expiry);
                if (fallbackResult.success) {
                    console.log('✅ SMS OTP fallback successful - CHECK CONSOLE/LOGS FOR TEST OTP');
                    log.info('SMS OTP fallback successful - using test service');
                    return {
                        ...fallbackResult,
                        service: 'Fallback-Test',
                        note: 'OTP logged to console - check server logs'
                    };
                }
            } catch (fallbackError) {
                log.error('SMS OTP fallback also failed:', fallbackError);
            }

            let errorMessage = 'Failed to send SMS OTP';

            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed - Invalid OTPless credentials';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request parameters for SMS';
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded - Please try again later';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
                details: error.response?.data,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Verify OTP - Based on PHP implementation from text file
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyOTP(otp, requestId) {
        try {
            log.info(`Verifying OTP for requestId: ${requestId}`, { otp: otp.length + ' digits' });

            // Validate inputs
            if (!otp || !requestId) {
                throw new Error('OTP and requestId are required');
            }

            // Based on PHP implementation from text file - exact format
            const data = {
                otp: otp.toString(),
                requestId: requestId
            };

            log.info('OTP verification request data:', { requestId, otpLength: otp.length });

            // Use the exact endpoint from PHP implementation
            const response = await axios.post(`${this.apiUrl}/verify/otp`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'clientId': this.clientId,
                    'clientSecret': this.clientSecret
                },
                timeout: 30000
            });

            log.info('OTP verification API response:', response.data);

            // Check isOTPVerified as in PHP implementation
            const isVerified = response.data.isOTPVerified === true;

            log.info('OTP verification result', { requestId, isVerified });

            if (isVerified) {
                return {
                    success: true,
                    isVerified: true,
                    requestId: response.data.requestId || requestId,
                    message: 'OTP verified successfully!'
                };
            } else {
                return {
                    success: false,
                    isVerified: false,
                    error: 'OTP verification failed: Incorrect or Expired OTP'
                };
            }

        } catch (error) {
            log.error('OTPless verify failed, trying fallback services:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                requestId: requestId
            });

            // Try SMS fallback first (if requestId suggests it's SMS)
            if (requestId.startsWith('sms_')) {
                log.info('Using SMS OTP verification fallback');
                try {
                    const smsResult = await smsOTPService.verifyOTP(otp, requestId);
                    if (smsResult.success) {
                        log.info('SMS OTP verification fallback successful');
                        return smsResult;
                    }
                } catch (smsError) {
                    log.error('SMS OTP verification fallback failed:', smsError);
                }
            }

            // Fallback to email OTP service
            log.info('Using email OTP verification fallback');
            try {
                const fallbackResult = await emailOTPService.verifyOTP(otp, requestId);
                if (fallbackResult.success) {
                    log.info('Email OTP verification fallback successful');
                    return fallbackResult;
                }
            } catch (fallbackError) {
                log.error('Email OTP verification fallback also failed:', fallbackError);
            }

            return {
                success: false,
                isVerified: false,
                error: error.response?.data?.message || error.message || 'Failed to verify OTP',
                details: error.response?.data
            };
        }
    }

    /**
     * Send OTP for registration
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendRegistrationOTP(email) {
        // Check if email OTP is enabled
        const isEmailOTPEnabled = await otpSettingsService.isEmailOTPEnabled();
        if (!isEmailOTPEnabled) {
            log.info('Email OTP is disabled by admin settings');
            return {
                success: false,
                error: 'Email OTP is currently disabled by administrator',
                disabled: true
            };
        }
        return this.sendOTP(email, 4, 300); // 5 minutes expiry for registration
    }

    /**
     * Send SMS OTP for registration
     * @param {string} phoneNumber - Phone number
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendRegistrationSMSOTP(phoneNumber) {
        // Check if mobile OTP is enabled
        const isMobileOTPEnabled = await otpSettingsService.isMobileOTPEnabled();
        if (!isMobileOTPEnabled) {
            log.info('Mobile OTP is disabled by admin settings');
            return {
                success: false,
                error: 'Mobile OTP is currently disabled by administrator',
                disabled: true
            };
        }
        return this.sendSMSOTP(phoneNumber, 4, 300); // 5 minutes expiry for registration
    }

    /**
     * Send OTP for login (2FA)
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendLoginOTP(email) {
        // Check if email OTP is enabled
        const isEmailOTPEnabled = await otpSettingsService.isEmailOTPEnabled();
        if (!isEmailOTPEnabled) {
            log.info('Email OTP is disabled by admin settings for login');
            return {
                success: false,
                error: 'Email OTP is currently disabled by administrator',
                disabled: true
            };
        }
        log.info('Sending login OTP for 2FA to:', email);
        return await this.sendOTP(email, 6, 300); // 6-digit OTP, 5 minutes expiry
    }

    /**
     * Verify OTP for login (2FA)
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyLoginOTP(otp, requestId) {
        log.info('Verifying login OTP for 2FA:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Send OTP for forgot password
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendForgotPasswordOTP(email) {
        // Check if email OTP is enabled
        const isEmailOTPEnabled = await otpSettingsService.isEmailOTPEnabled();
        if (!isEmailOTPEnabled) {
            log.info('Email OTP is disabled by admin settings for forgot password');
            return {
                success: false,
                error: 'Email OTP is currently disabled by administrator',
                disabled: true
            };
        }
        log.info('Sending forgot password OTP to:', email);
        return await this.sendOTP(email, 4, 600); // 4-digit OTP, 10 minutes expiry
    }

    /**
     * Verify OTP for forgot password
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyForgotPasswordOTP(otp, requestId) {
        log.info('Verifying forgot password OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Send OTP for 2FA verification
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async send2FAOTP(email) {
        // Check if email OTP is enabled
        const isEmailOTPEnabled = await otpSettingsService.isEmailOTPEnabled();
        if (!isEmailOTPEnabled) {
            log.info('Email OTP is disabled by admin settings for 2FA');
            return {
                success: false,
                error: 'Email OTP is currently disabled by administrator',
                disabled: true
            };
        }
        log.info('Sending 2FA OTP to:', email);
        return await this.sendOTP(email, 6, 180); // 6-digit OTP, 3 minutes expiry for 2FA
    }

    /**
     * Verify registration OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyRegistrationOTP(otp, requestId) {
        log.info('Verifying registration OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Verify registration SMS OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyRegistrationSMSOTP(otp, requestId) {
        log.info('Verifying registration SMS OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Send forgot password SMS OTP
     * @param {string} phoneNumber - Phone number
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendForgotPasswordSMSOTP(phoneNumber) {
        // Check if mobile OTP is enabled
        const isMobileOTPEnabled = await otpSettingsService.isMobileOTPEnabled();
        if (!isMobileOTPEnabled) {
            log.info('Mobile OTP is disabled by admin settings for forgot password');
            return {
                success: false,
                error: 'Mobile OTP is currently disabled by administrator',
                disabled: true
            };
        }
        return this.sendSMSOTP(phoneNumber, 4, 300); // 5 minutes expiry for forgot password
    }

    /**
     * Verify forgot password SMS OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyForgotPasswordSMSOTP(otp, requestId) {
        log.info('Verifying forgot password SMS OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Verify 2FA OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verify2FAOTP(otp, requestId) {
        log.info('Verifying 2FA OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }
}

module.exports = new OTPlessService();
