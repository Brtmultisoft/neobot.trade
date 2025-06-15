const Router = require('express').Router();
/**
 * All Controllers
 */
const {
    publicController,
    userTradingPackageController
} = require('../../controllers');

/**
 * All Middlewares
 */

const {
    webhookMiddleware
} = require("../../middlewares");


module.exports = () => {

    /**
     * Public Trading Package Routes (No Authentication Required)
     * These routes are completely public and bypass all authentication
     */

    // Test route
    Router.get('/test', (req, res) => {
        res.json({
            status: true,
            message: 'Public routes working!',
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    });

    // Trading package routes
    Router.get('/trading-packages', userTradingPackageController.getAllTradingPackages);
    Router.get('/trading-packages/:id', userTradingPackageController.getTradingPackageById);
    Router.post('/trading-packages/find-by-amount', userTradingPackageController.findPackageByAmount);
    Router.post('/trading-packages/calculate-returns', userTradingPackageController.calculateReturns);

    // Router.get("/get-reports-in-csv/:name", publicController.getReportsByQuery);

    return Router;
}
