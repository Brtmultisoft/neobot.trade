'use strict';
const express = require('express');
const router = express.Router();
const rewardMasterController = require('../../controllers/admin/rewardMaster.controller');
const { adminAuthenticateMiddleware } = require('../../middlewares');

// Apply authentication middleware to all routes
router.use(adminAuthenticateMiddleware);

// Create a new reward master
router.post('/create-reward-master', rewardMasterController.createRewardMaster);

// Get all reward masters
router.get('/get-all-reward-masters', rewardMasterController.getAllRewardMasters);

// Get a single reward master by ID
router.get('/get-reward-master/:id', rewardMasterController.getRewardMasterById);

// Update a reward master
router.put('/update-reward-master/:id', rewardMasterController.updateRewardMaster);

// Delete a reward master
router.delete('/delete-reward-master/:id', rewardMasterController.deleteRewardMaster);
router.get("/test",(req,res)=>{
    res.send("working....")
})
module.exports = router; 