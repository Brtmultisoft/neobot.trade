const mongoose = require('mongoose');

const rewardMasterSchema = new mongoose.Schema({
  reward_type: {
    type: String,
    required: true,
    unique: true // unique identifier (e.g., goa_tour, car_reward)
  },
  reward_name: {
    type: String,
    required: true
  },
  reward_value: {
    type: String,
    required: true
  },
  self_invest_target: {
    type: Number,
    required: true
  },
  direct_business_target: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  extra: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

rewardMasterSchema.index({ reward_type: 1 }, { unique: true });

module.exports = mongoose.models.RewardMaster || mongoose.model('RewardMaster', rewardMasterSchema);
