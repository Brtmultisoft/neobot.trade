'use strict';

const { tradingPackageModel } = require('../../models');
const responseHelper = require('../../utils/customResponse');
const log = require('../../services/logger').getAppLevelInstance();

/**
 * Trading Package Controller
 * Handles all trading package related operations
 */

/**
 * Get all active trading packages
 * @route GET /api/v1/trading-packages
 */
const getAllTradingPackages = async (req, res) => {
    try {
        log.info('Fetching all active trading packages');

        // Debug logging
        console.log('🔍 API Controller Debug:');
        console.log(`   Database: ${tradingPackageModel.db.name}`);
        console.log(`   Collection: ${tradingPackageModel.collection.name}`);

        // First check total count
        const totalCount = await tradingPackageModel.countDocuments();
        console.log(`   Total documents: ${totalCount}`);

        // Check active count (excluding deleted packages)
        const activeCount = await tradingPackageModel.countDocuments({
            status: true,
            is_deleted: { $ne: true }
        });
        console.log(`   Active documents: ${activeCount}`);

        const packages = await tradingPackageModel.find({
            status: true,
            is_deleted: { $ne: true }
        })
            .sort({ sort_order: 1 })
            .select('-__v');

        console.log(`   Query result: ${packages.length} packages`);

        const responseData = {
            success: true,
            message: 'Trading packages retrieved successfully',
            data: packages,
            count: packages.length,
            debug: {
                database: tradingPackageModel.db.name,
                collection: tradingPackageModel.collection.name,
                totalCount,
                activeCount
            }
        };

        return responseHelper.success(res, responseData);

    } catch (error) {
        log.error('Error fetching trading packages:', error);
        console.error('❌ API Controller Error:', error);
        const responseData = {
            success: false,
            message: 'Failed to fetch trading packages',
            error: error.message
        };
        return responseHelper.error(res, responseData);
    }
};

/**
 * Get trading package by ID
 * @route GET /api/v1/trading-packages/:id
 */
const getTradingPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        log.info(`Fetching trading package with ID: ${id}`);
        
        const pkg = await tradingPackageModel.findOne({
            _id: id,
            status: true,
            is_deleted: { $ne: true }
        }).select('-__v');

        if (!pkg) {
            const responseData = {
                success: false,
                message: 'Trading package not found or not available'
            };
            return responseHelper.notFound(res, responseData);
        }
        
        if (!pkg.daily_trading_roi && pkg.daily_trading_roi !== 0) {
            pkg.daily_trading_roi = 0.9;
        }
        
        const responseData = {
            success: true,
            message: 'Trading package retrieved successfully',
            data: pkg
        };
        
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Error fetching trading package by ID:', error);
        const responseData = {
            success: false,
            message: 'Failed to fetch trading package',
            error: error.message
        };
        return responseHelper.error(res, responseData);
    }
};

/**
 * Find trading package by investment amount
 * @route POST /api/v1/trading-packages/find-by-amount
 */
const findPackageByAmount = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            const responseData = {
                success: false,
                message: 'Valid investment amount is required'
            };
            return responseHelper.badRequest(res, responseData);
        }
        
        log.info(`Finding trading package for amount: $${amount}`);
        
        const pkg = await tradingPackageModel.findByTradingAmount(amount);
        
        if (!pkg) {
            const responseData = {
                success: false,
                message: `No trading package found for investment amount $${amount}`
            };
            return responseHelper.notFound(res, responseData);
        }
        
        if (!pkg.daily_trading_roi && pkg.daily_trading_roi !== 0) {
            pkg.daily_trading_roi = 0.9;
        }
        
        const responseData = {
            success: true,
            message: 'Trading package found successfully',
            data: pkg,
            investment_amount: amount
        };
        
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Error finding trading package by amount:', error);
        const responseData = {
            success: false,
            message: 'Failed to find trading package',
            error: error.message
        };
        return responseHelper.error(res, responseData);
    }
};

/**
 * Calculate potential returns for an investment amount
 * @route POST /api/v1/trading-packages/calculate-returns
 */
const calculateReturns = async (req, res) => {
    try {
        const { amount, days = 30 } = req.body;
        
        if (!amount || amount <= 0) {
            const responseData = {
                success: false,
                message: 'Valid investment amount is required'
            };
            return responseHelper.badRequest(res, responseData);
        }
        
        log.info(`Calculating returns for amount: $${amount} over ${days} days`);
        
        const pkg = await tradingPackageModel.findByTradingAmount(amount);
        
        if (!pkg) {
            const responseData = {
                success: false,
                message: `No trading package found for investment amount $${amount}`
            };
            return responseHelper.notFound(res, responseData);
        }
        
        if (!pkg.daily_trading_roi && pkg.daily_trading_roi !== 0) {
            pkg.daily_trading_roi = 0.9;
        }
        
        // Calculate returns
        const roi = (pkg.daily_trading_roi || pkg.daily_trading_roi === 0) ? pkg.daily_trading_roi : 0.9;
        const dailyRoi = roi / 100; // Convert percentage to decimal
        const dailyReturn = amount * dailyRoi;
        const totalReturn = dailyReturn * days;
        const totalAmount = amount + totalReturn;
        
        const responseData = {
            success: true,
            message: 'Returns calculated successfully',
            data: {
                package: {
                    name: pkg.name,
                    daily_roi: roi
                },
                investment: {
                    amount: amount,
                    days: days
                },
                returns: {
                    daily_return: Math.round(dailyReturn * 100) / 100,
                    total_return: Math.round(totalReturn * 100) / 100,
                    total_amount: Math.round(totalAmount * 100) / 100
                }
            }
        };
        
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Error calculating returns:', error);
        const responseData = {
            success: false,
            message: 'Failed to calculate returns',
            error: error.message
        };
        return responseHelper.error(res, responseData);
    }
};

module.exports = {
    getAllTradingPackages,
    getTradingPackageById,
    findPackageByAmount,
    calculateReturns
};
