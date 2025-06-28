const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reward_type: {
        type: String,
      
        required: true
    },
    reward_name: {
        type: String,
        required: true
    },
    self_invest_target: {
        type: Number,
        required: true
    },
    self_invest_achieved: {
        type: Number,
        required: true
    },
    direct_business_target: {
        type: Number,
        required: true
    },
    direct_business_achieved: {
        type: Number,
        required: true
    },
    qualification_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['qualified', 'approved', 'processed', 'completed', 'rejected'],
        default: 'qualified'
    },
    reward_value: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    processed_at: {
        type: Date,
        default: null
    },
    extra: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better performance
rewardSchema.index({ user_id: 1 });
rewardSchema.index({ reward_type: 1 });
rewardSchema.index({ status: 1 });
rewardSchema.index({ qualification_date: 1 });

// Virtual for user details
rewardSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

// Virtual for processor details
rewardSchema.virtual('processor', {
    ref: 'User',
    localField: 'processed_by',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
rewardSchema.set('toJSON', { virtuals: true });
rewardSchema.set('toObject', { virtuals: true });

// Static method to get reward targets
rewardSchema.statics.getRewardTargets = function() {
    return {
        goa_tour: {
            name: "Goa Tour",
            self_invest_target: 1000,
            direct_business_target: 1500,
            reward_value: "Goa Tour Package"
        },
        bangkok_tour: {
            name: "Bangkok Tour",
            self_invest_target: 5000,
            direct_business_target: 10000,
            reward_value: "Bangkok Tour Package"
        }
    };
};

// Instance method to check if reward is completed
rewardSchema.methods.isCompleted = function() {
    return this.status === 'completed';
};

// Instance method to check if reward is pending approval
rewardSchema.methods.isPendingApproval = function() {
    return this.status === 'qualified';
};

// Instance method to check if reward qualifies (OR logic - either target can qualify)
rewardSchema.methods.isQualified = function() {
    const selfInvestComplete = this.self_invest_achieved >= this.self_invest_target;
    const directBusinessComplete = this.direct_business_achieved >= this.direct_business_target;

    // User qualifies if EITHER target is met (OR logic)
    return selfInvestComplete || directBusinessComplete;
};

// Instance method to get qualification details
rewardSchema.methods.getQualificationDetails = function() {
    const selfInvestComplete = this.self_invest_achieved >= this.self_invest_target;
    const directBusinessComplete = this.direct_business_achieved >= this.direct_business_target;

    return {
        selfInvestComplete,
        directBusinessComplete,
        isQualified: selfInvestComplete || directBusinessComplete,
        selfInvestProgress: (this.self_invest_achieved / this.self_invest_target) * 100,
        directBusinessProgress: (this.direct_business_achieved / this.direct_business_target) * 100
    };
};

// Pre-save middleware to set qualification date
rewardSchema.pre('save', function(next) {
    if (this.isNew && !this.qualification_date) {
        this.qualification_date = new Date();
    }
    next();
});

// Check if model already exists to prevent OverwriteModelError
module.exports = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);
