'use strict';

const express = require('express');
const router = express.Router();

// Import controller
const {
    getROISettings,
    updateROISetting,
    getTradingPackages,
    getROIRangesSummary,
    testROIGeneration,
    calculateWithdrawalFee
} = require('../../controllers/admin/roi-settings.controller');

// Import middleware
const { adminAuthenticateMiddleware } = require('../../middlewares');
const { validationMiddleware } = require('../../middlewares');

// Validation schemas
const updateROISettingSchema = {
    body: {
        type: 'object',
        required: ['name', 'value'],
        properties: {
            name: {
                type: 'string',
                enum: [
                    'silver_package_monthly_roi_min',
                    'silver_package_monthly_roi_max',
                    'gold_package_monthly_roi_min',
                    'gold_package_monthly_roi_max',
                    'silver_package_amount_threshold',
                    'withdrawal_fee_percentage',
                    'minimum_withdrawal_amount'
                ]
            },
            value: {
                type: ['string', 'number'],
                minimum: 0.01
            },
            description: {
                type: 'string',
                maxLength: 500
            }
        },
        additionalProperties: false
    }
};

const testROIGenerationSchema = {
    body: {
        type: 'object',
        required: ['amount'],
        properties: {
            amount: {
                type: 'number',
                minimum: 1,
                maximum: 1000000
            }
        },
        additionalProperties: false
    }
};

const calculateWithdrawalFeeSchema = {
    body: {
        type: 'object',
        required: ['amount'],
        properties: {
            amount: {
                type: 'number',
                minimum: 0.01,
                maximum: 1000000
            }
        },
        additionalProperties: false
    }
};

/**
 * @route   GET /api/admin/settings/roi-settings
 * @desc    Get all ROI settings
 * @access  Admin
 */
router.get('/roi-settings', adminAuthenticateMiddleware, getROISettings);

/**
 * @route   POST /api/admin/settings/roi-settings
 * @desc    Update or create ROI setting
 * @access  Admin
 */
router.post('/roi-settings',
    adminAuthenticateMiddleware,
    validationMiddleware(updateROISettingSchema, 'body'),
    updateROISetting
);

/**
 * @route   GET /api/admin/settings/trading-packages
 * @desc    Get trading packages for ROI settings
 * @access  Admin
 */
router.get('/trading-packages', adminAuthenticateMiddleware, getTradingPackages);

/**
 * @route   GET /api/admin/settings/roi-ranges-summary
 * @desc    Get ROI ranges summary
 * @access  Admin
 */
router.get('/roi-ranges-summary', adminAuthenticateMiddleware, getROIRangesSummary);

/**
 * @route   POST /api/admin/settings/test-roi-generation
 * @desc    Test ROI generation for given amount
 * @access  Admin
 */
router.post('/test-roi-generation',
    adminAuthenticateMiddleware,
    validationMiddleware(testROIGenerationSchema, 'body'),
    testROIGeneration
);

/**
 * @route   POST /api/admin/settings/calculate-withdrawal-fee
 * @desc    Calculate withdrawal fee and net amount
 * @access  Admin
 */
router.post('/calculate-withdrawal-fee',
    adminAuthenticateMiddleware,
    validationMiddleware(calculateWithdrawalFeeSchema, 'body'),
    calculateWithdrawalFee
);

module.exports = router;
