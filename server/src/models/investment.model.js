'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Investment Schema Model
 */
const investmentSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    investment_plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'InvestmentPlans'
    },
    trading_package_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'TradingPackages',
        default: null
    },
    package_investment_time: {
        type: Date,
        default: Date.now
    },
    referrer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 1,        // Changed from 50 to 1 to allow package-based validation
        max: 10000000  // Increased to 10M to support higher investment packages
    },
    daily_profit: {
        type: Number,
        default: 0
    },
    first_deposit_bonus: {
        type: Number,
        default: 0
    },
    referral_bonus: {
        type: Number,
        default: 0
    },
    team_commission: {
        level1: { type: Number, default: 0 },
        level2: { type: Number, default: 0 },
        level3: { type: Number, default: 0 }
    },
    active_member_reward: {
        type: Number,
        default: 0
    },
    total_earnings: {
        type: Number,
        default: 0
    },
    package_type: {
        type: String,
        default: 'trading'
    },
    type: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled',"expired", 1, 2, 0],
        default: 'active'
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    last_profit_date: {
        type: Date,
        default: Date.now
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
investmentSchema.plugin(toJSON);
investmentSchema.plugin(paginate);

// Add indexes for frequently queried fields
investmentSchema.index({ user_id: 1 });
investmentSchema.index({ investment_plan_id: 1 });
investmentSchema.index({ trading_package_id: 1 });
investmentSchema.index({ referrer_id: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ created_at: -1 });
investmentSchema.index({ start_date: -1 });
investmentSchema.index({ last_profit_date: -1 });
investmentSchema.index({ package_investment_time: -1 });
investmentSchema.index({ amount: -1 });
investmentSchema.index({ package_type: 1 });

// Add compound indexes for common query combinations
investmentSchema.index({ user_id: 1, status: 1 });
investmentSchema.index({ user_id: 1, created_at: -1 });
investmentSchema.index({ status: 1, created_at: -1 });
investmentSchema.index({ package_type: 1, status: 1 });
investmentSchema.index({ user_id: 1, investment_plan_id: 1 });

module.exports = mongoose.model('Investments', investmentSchema);