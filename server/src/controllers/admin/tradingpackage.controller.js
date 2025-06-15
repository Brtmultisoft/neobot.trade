'use strict';

const logger = require('../../services/logger');
const log = new logger('AdminTradingPackageController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const tradingPackageModel = require('../../models/tradingpackage.model');

/**
 * Admin Trading Package Controller
 * Handles CRUD operations for trading packages
 */
module.exports = {

    /**
     * Get all trading packages with pagination and filtering
     */
    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getAll Trading Packages:', reqObj);
        let responseData = {};
        
        try {
            // Build query filters
            let query = {
                // Exclude deleted packages by default
                is_deleted: { $ne: true }
            };

            // Filter by status if provided
            if (reqObj.status !== undefined) {
                query.status = reqObj.status === 'true';
            }

            // Filter by name if provided
            if (reqObj.name) {
                query.name = { $regex: reqObj.name, $options: 'i' };
            }

            // Allow showing deleted packages if explicitly requested
            if (reqObj.include_deleted === 'true') {
                delete query.is_deleted;
            }
            
            // Pagination
            const page = parseInt(reqObj.page) || 1;
            const limit = parseInt(reqObj.limit) || 10;
            const skip = (page - 1) * limit;
            
            // Get total count
            const totalCount = await tradingPackageModel.countDocuments(query);
            
            // Get packages with pagination
            const packages = await tradingPackageModel.find(query)
                .sort({ sort_order: 1, created_at: -1 })
                .skip(skip)
                .limit(limit)
                .select('-__v');
            
            responseData.msg = 'Trading packages fetched successfully!';
            responseData.data = {
                packages,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    limit
                }
            };
            
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Failed to fetch trading packages with error::', error);
            responseData.msg = 'Failed to fetch trading packages';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get single trading package by ID
     */
    getOne: async (req, res) => {
        const { id } = req.params;
        log.info('Received request for getOne Trading Package:', id);
        let responseData = {};
        
        try {
            const tradingPackage = await tradingPackageModel.findOne({
                _id: id,
                is_deleted: { $ne: true }
            }).select('-__v');

            if (!tradingPackage) {
                responseData.msg = 'Trading package not found or has been deleted';
                return responseHelper.error(res, responseData);
            }

            responseData.msg = 'Trading package fetched successfully!';
            responseData.data = tradingPackage;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Failed to fetch trading package with error::', error);
            responseData.msg = 'Failed to fetch trading package';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Add new trading package
     */
    add: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        log.info('Received request to add Trading Package:', reqObj);
        
        try {
            // Validate required fields (package_number is auto-generated)
            if (!reqObj.name ||
                reqObj.trading_amount_from === undefined ||
                reqObj.trading_amount_to === undefined ||
                reqObj.daily_trading_roi === undefined) {
                responseData.msg = 'Name, trading amount range, and daily ROI are required';
                return responseHelper.error(res, responseData);
            }
            
            // Check if package name already exists (excluding deleted packages)
            const existingPackage = await tradingPackageModel.findOne({
                name: reqObj.name,
                is_deleted: { $ne: true }
            });

            if (existingPackage) {
                responseData.msg = 'Trading package with this name already exists';
                return responseHelper.error(res, responseData);
            }

            // Auto-generate package number
            const lastPackage = await tradingPackageModel.findOne(
                {},
                {},
                { sort: { package_number: -1 } }
            );
            const nextPackageNumber = lastPackage ? lastPackage.package_number + 1 : 1;
            
            // Prepare data for creation
            let data = {
                name: reqObj.name.trim(),
                package_number: nextPackageNumber, // Auto-generated package number
                trading_amount_from: parseFloat(reqObj.trading_amount_from),
                trading_amount_to: parseFloat(reqObj.trading_amount_to),
                daily_trading_roi: parseFloat(reqObj.daily_trading_roi),
                description: reqObj.description ? reqObj.description.trim() : '',
                features: reqObj.features || [],
                is_unlimited: reqObj.is_unlimited || false,
                sort_order: reqObj.sort_order || nextPackageNumber, // Use package number as default sort order
                status: reqObj.status !== undefined ? reqObj.status : true
            };
            
            // Validate trading amount range
            if (data.trading_amount_to < data.trading_amount_from && !data.is_unlimited) {
                responseData.msg = 'Trading amount to must be greater than or equal to trading amount from';
                return responseHelper.error(res, responseData);
            }
            
            // Create the trading package
            const newTradingPackage = await tradingPackageModel.create(data);

            responseData.msg = "Trading package added successfully!";
            responseData.data = newTradingPackage;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Failed to add trading package with error::', error);

            // Handle MongoDB duplicate key errors
            if (error.code === 11000) {
                if (error.keyPattern && error.keyPattern.name) {
                    responseData.msg = 'A trading package with this name already exists. Please choose a different name.';
                } else if (error.keyPattern && error.keyPattern.package_number) {
                    responseData.msg = 'A trading package with this package number already exists. Please choose a different number.';
                } else {
                    responseData.msg = 'A trading package with these details already exists. Please modify the details.';
                }
            } else {
                responseData.msg = "Failed to add trading package";
                responseData.error = error.message;
            }

            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Update existing trading package
     */
    update: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        log.info('Received request to update Trading Package:', reqObj);

        try {
            const { id } = reqObj;

            if (!id) {
                responseData.msg = 'Trading package ID is required';
                return responseHelper.error(res, responseData);
            }

            // Check if package exists and is not deleted
            const existingPackage = await tradingPackageModel.findOne({
                _id: id,
                is_deleted: { $ne: true }
            });
            if (!existingPackage) {
                responseData.msg = 'Trading package not found or has been deleted';
                return responseHelper.error(res, responseData);
            }

            // Check if name is being changed and if new name already exists (excluding deleted packages)
            if (reqObj.name && reqObj.name !== existingPackage.name) {
                const nameExists = await tradingPackageModel.findOne({
                    name: reqObj.name,
                    _id: { $ne: id },
                    is_deleted: { $ne: true }
                });

                if (nameExists) {
                    responseData.msg = 'Trading package with this name already exists';
                    return responseHelper.error(res, responseData);
                }
            }

            // Package number and sort_order are auto-generated and should not be updated manually
            // Remove them from update if provided
            if (reqObj.package_number) {
                delete reqObj.package_number;
            }
            if (reqObj.sort_order) {
                delete reqObj.sort_order;
            }

            // Prepare update data
            let updateData = {
                updated_at: new Date()
            };

            // Update fields if provided (package_number and sort_order are auto-generated and not updatable)
            if (reqObj.name) updateData.name = reqObj.name.trim();
            if (reqObj.trading_amount_from !== undefined) updateData.trading_amount_from = parseFloat(reqObj.trading_amount_from);
            if (reqObj.trading_amount_to !== undefined) updateData.trading_amount_to = parseFloat(reqObj.trading_amount_to);
            if (reqObj.daily_trading_roi !== undefined) updateData.daily_trading_roi = parseFloat(reqObj.daily_trading_roi);
            if (reqObj.description !== undefined) updateData.description = reqObj.description.trim();
            if (reqObj.features) updateData.features = reqObj.features;
            if (reqObj.is_unlimited !== undefined) updateData.is_unlimited = reqObj.is_unlimited;
            if (reqObj.status !== undefined) updateData.status = reqObj.status;

            // Validate trading amount range if both values are being updated
            if (updateData.trading_amount_from !== undefined && updateData.trading_amount_to !== undefined) {
                if (updateData.trading_amount_to < updateData.trading_amount_from && !updateData.is_unlimited) {
                    responseData.msg = 'Trading amount to must be greater than or equal to trading amount from';
                    return responseHelper.error(res, responseData);
                }
            }

            // Update the trading package
            const updatedTradingPackage = await tradingPackageModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-__v');

            responseData.msg = "Trading package updated successfully!";
            responseData.data = updatedTradingPackage;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update trading package with error::', error);
            responseData.msg = "Failed to update trading package";
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Delete trading package (soft delete by setting status to false)
     */
    delete: async (req, res) => {
        const { id } = req.params;
        log.info('=== DELETE TRADING PACKAGE REQUEST ===');
        log.info('Package ID received:', id);
        log.info('ID type:', typeof id);
        log.info('ID length:', id ? id.length : 'undefined');
        log.info('Request headers:', req.headers);
        log.info('=====================================');

        let responseData = {};

        try {
            // Validate ObjectId format
            if (!id) {
                log.error('No ID provided in request params');
                responseData.msg = 'Package ID is required';
                return responseHelper.error(res, responseData);
            }

            // Check if ID is valid MongoDB ObjectId format
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(id)) {
                log.error('Invalid ObjectId format:', id);
                responseData.msg = 'Invalid package ID format';
                return responseHelper.error(res, responseData);
            }

            log.info('Searching for package with ID:', id);

            // Check if package exists
            const existingPackage = await tradingPackageModel.findById(id);
            log.info('Package found:', existingPackage ? 'Yes' : 'No');

            if (!existingPackage) {
                log.error('Trading package not found with ID:', id);
                responseData.msg = 'Trading package not found';
                return responseHelper.error(res, responseData);
            }

            log.info('Current package status:', existingPackage.status);
            log.info('Proceeding with soft delete (setting status to false)');

            // Soft delete by setting status to false and adding deleted flag
            const updateData = {
                status: false,
                is_deleted: true,
                deleted_at: new Date(),
                updated_at: new Date()
            };

            log.info('Update data:', updateData);

            const deletedTradingPackage = await tradingPackageModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-__v');

            log.info('Package updated successfully:', deletedTradingPackage ? 'Yes' : 'No');
            log.info('Updated package status:', deletedTradingPackage?.status);
            log.info('Updated package is_deleted:', deletedTradingPackage?.is_deleted);

            if (!deletedTradingPackage) {
                log.error('Failed to update package - no result returned');
                responseData.msg = "Failed to delete trading package - update returned null";
                return responseHelper.error(res, responseData);
            }

            responseData.msg = "Trading package deleted successfully!";
            responseData.data = deletedTradingPackage;

            log.info('Sending success response');
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete trading package with error::', error);
            log.error('Error stack:', error.stack);
            responseData.msg = "Failed to delete trading package";
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Update trading package status
     */
    updateStatus: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        log.info('Received request to update Trading Package status:', reqObj);

        try {
            const { id, status } = reqObj;

            if (!id || status === undefined) {
                responseData.msg = 'Trading package ID and status are required';
                return responseHelper.error(res, responseData);
            }

            // Check if package exists and is not deleted
            const existingPackage = await tradingPackageModel.findOne({
                _id: id,
                is_deleted: { $ne: true }
            });
            if (!existingPackage) {
                responseData.msg = 'Trading package not found or has been deleted';
                return responseHelper.error(res, responseData);
            }

            // Update status
            const updatedTradingPackage = await tradingPackageModel.findByIdAndUpdate(
                id,
                {
                    status: status,
                    updated_at: new Date()
                },
                { new: true }
            ).select('-__v');

            responseData.msg = `Trading package ${status ? 'enabled' : 'disabled'} successfully!`;
            responseData.data = updatedTradingPackage;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update trading package status with error::', error);
            responseData.msg = "Failed to update trading package status";
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    }
};
