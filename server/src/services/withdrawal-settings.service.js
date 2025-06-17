'use strict';

const { getROIRanges } = require('../seeders/roi-settings.seeder');
const logger = require('./logger');
const log = logger.getAppLevelInstance();

/**
 * Withdrawal Settings Service
 * Handles withdrawal fee and minimum amount calculations
 */

class WithdrawalSettingsService {
    /**
     * Get withdrawal settings from database
     */
    async getWithdrawalSettings() {
        try {
            const settings = await getROIRanges();
            
            return {
                withdrawalFeePercentage: settings.withdrawalFeePercentage || 10,
                minimumWithdrawalAmount: settings.minimumWithdrawalAmount || 20
            };
        } catch (error) {
            log.error('Error fetching withdrawal settings:', error);
            // Return defaults on error
            return {
                withdrawalFeePercentage: 10,
                minimumWithdrawalAmount: 20
            };
        }
    }

    /**
     * Calculate withdrawal fee
     */
    async calculateWithdrawalFee(amount) {
        try {
            const settings = await this.getWithdrawalSettings();
            const feeAmount = (parseFloat(amount) * settings.withdrawalFeePercentage) / 100;
            const netAmount = parseFloat(amount) - feeAmount;

            return {
                originalAmount: parseFloat(amount),
                feePercentage: settings.withdrawalFeePercentage,
                feeAmount: parseFloat(feeAmount.toFixed(2)),
                netAmount: parseFloat(netAmount.toFixed(2))
            };
        } catch (error) {
            log.error('Error calculating withdrawal fee:', error);
            // Return with default 10% fee
            const feeAmount = (parseFloat(amount) * 10) / 100;
            const netAmount = parseFloat(amount) - feeAmount;

            return {
                originalAmount: parseFloat(amount),
                feePercentage: 10,
                feeAmount: parseFloat(feeAmount.toFixed(2)),
                netAmount: parseFloat(netAmount.toFixed(2))
            };
        }
    }

    /**
     * Validate withdrawal amount
     */
    async validateWithdrawalAmount(amount) {
        try {
            const settings = await this.getWithdrawalSettings();
            const numAmount = parseFloat(amount);

            if (isNaN(numAmount) || numAmount <= 0) {
                return {
                    valid: false,
                    message: 'Invalid withdrawal amount'
                };
            }

            if (numAmount < settings.minimumWithdrawalAmount) {
                return {
                    valid: false,
                    message: `Minimum withdrawal amount is $${settings.minimumWithdrawalAmount}`
                };
            }

            return {
                valid: true,
                message: 'Valid withdrawal amount'
            };
        } catch (error) {
            log.error('Error validating withdrawal amount:', error);
            // Use default minimum
            const numAmount = parseFloat(amount);
            
            if (isNaN(numAmount) || numAmount <= 0) {
                return {
                    valid: false,
                    message: 'Invalid withdrawal amount'
                };
            }

            if (numAmount < 20) {
                return {
                    valid: false,
                    message: 'Minimum withdrawal amount is $20'
                };
            }

            return {
                valid: true,
                message: 'Valid withdrawal amount'
            };
        }
    }

    /**
     * Process withdrawal with fee calculation
     */
    async processWithdrawalCalculation(amount, userBalance) {
        try {
            // Validate withdrawal amount
            const validation = await this.validateWithdrawalAmount(amount);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Calculate fee
            const feeCalculation = await this.calculateWithdrawalFee(amount);

            // Check if user has sufficient balance
            if (parseFloat(userBalance) < feeCalculation.originalAmount) {
                return {
                    success: false,
                    message: 'Insufficient balance for withdrawal'
                };
            }

            return {
                success: true,
                message: 'Withdrawal calculation successful',
                calculation: feeCalculation
            };
        } catch (error) {
            log.error('Error processing withdrawal calculation:', error);
            return {
                success: false,
                message: 'Error processing withdrawal calculation'
            };
        }
    }

    /**
     * Get withdrawal summary for display
     */
    async getWithdrawalSummary(amount) {
        try {
            const settings = await this.getWithdrawalSettings();
            const feeCalculation = await this.calculateWithdrawalFee(amount);

            return {
                settings,
                calculation: feeCalculation,
                summary: {
                    requestedAmount: feeCalculation.originalAmount,
                    feePercentage: feeCalculation.feePercentage,
                    feeAmount: feeCalculation.feeAmount,
                    netAmount: feeCalculation.netAmount,
                    minimumAmount: settings.minimumWithdrawalAmount
                }
            };
        } catch (error) {
            log.error('Error getting withdrawal summary:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const withdrawalSettingsService = new WithdrawalSettingsService();
module.exports = withdrawalSettingsService;
