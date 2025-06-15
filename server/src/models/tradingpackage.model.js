'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating TradingPackage Schema Model
 */
const tradingPackageSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    package_number: {
        type: Number,
        required: true
    },
    trading_amount_from: {
        type: Number,
        required: true,
        min: 0
    },
    trading_amount_to: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function(value) {
                // For unlimited packages, we can use a very large number or null
                return value === null || value >= this.trading_amount_from;
            },
            message: 'Trading amount to must be greater than or equal to trading amount from'
        }
    },
    daily_trading_roi: {
        type: Number,
        required: true,
        min: 0,
        max: 100 // Percentage, so max 100%
    },
    description: {
        type: String,
        trim: true
    },
    features: {
        type: [String],
        default: []
    },
    is_unlimited: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    deleted_at: {
        type: Date,
        default: null
    },
    sort_order: {
        type: Number,
        default: 0
    },
    extra: {
        type: Object,
        default: {}
    }
}, { 
    timestamps: { 
        createdAt: 'created_at', 
        updatedAt: 'updated_at' 
    } 
});

// add plugin that converts mongoose to json
tradingPackageSchema.plugin(toJSON);
tradingPackageSchema.plugin(paginate);

// Add indexes for frequently queried fields
tradingPackageSchema.index({ name: 1 });
tradingPackageSchema.index({ package_number: 1 });
tradingPackageSchema.index({ status: 1 });
tradingPackageSchema.index({ is_deleted: 1 });
tradingPackageSchema.index({ created_at: -1 });
tradingPackageSchema.index({ trading_amount_from: 1 });
tradingPackageSchema.index({ trading_amount_to: 1 });
tradingPackageSchema.index({ daily_trading_roi: 1 });
tradingPackageSchema.index({ sort_order: 1 });

// Add compound indexes for common query combinations
tradingPackageSchema.index({ status: 1, is_deleted: 1, sort_order: 1 });
tradingPackageSchema.index({ trading_amount_from: 1, trading_amount_to: 1 });
tradingPackageSchema.index({ status: 1, is_deleted: 1, created_at: -1 });
tradingPackageSchema.index({ is_deleted: 1, status: 1 });

// Add compound unique indexes to allow same name/number for deleted packages
tradingPackageSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { is_deleted: { $exists: false } },
        { is_deleted: false }
      ]
    },
    name: 'name_active_unique'
  }
);
tradingPackageSchema.index(
  { package_number: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { is_deleted: { $exists: false } },
        { is_deleted: false }
      ]
    },
    name: 'package_number_active_unique'
  }
);

// Instance method to check if an amount falls within this package range
tradingPackageSchema.methods.isAmountInRange = function(amount) {
    if (this.is_unlimited) {
        return amount >= this.trading_amount_from;
    }
    return amount >= this.trading_amount_from && amount <= this.trading_amount_to;
};

// Static method to find package by trading amount
tradingPackageSchema.statics.findByTradingAmount = function(amount) {
    return this.findOne({
        status: true,
        is_deleted: { $ne: true }, // Exclude deleted packages
        $or: [
            {
                is_unlimited: true,
                trading_amount_from: { $lte: amount }
            },
            {
                is_unlimited: false,
                trading_amount_from: { $lte: amount },
                trading_amount_to: { $gte: amount }
            }
        ]
    }).sort({ sort_order: 1 });
};

module.exports = mongoose.model('TradingPackages', tradingPackageSchema);
