const express = require('express');
const SpectatorController = require('../controllers/SpectatorController');
const { authMiddleware, authSpectator } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/spectatorSwagger');

// Protected routes - profile
router.get('/profile', authMiddleware, authSpectator, SpectatorController.getSpectatorProfile);
router.put('/profile', authMiddleware, authSpectator, SpectatorController.updateProfile);

// Protected routes - wallet
router.get('/wallet', authMiddleware, authSpectator, SpectatorController.getWalletInfo);
router.get('/transactions', authMiddleware, authSpectator, SpectatorController.getTransactionHistory);

// Protected routes - statistics
router.get('/statistics', authMiddleware, authSpectator, SpectatorController.getStatistics);
router.get('/statistics/rewards-series', authMiddleware, authSpectator, SpectatorController.getRewardsEarningsSeries);
// Mobile-compatible aliases
router.post('/transactions/deposit', authMiddleware, authSpectator, SpectatorController.depositPoints);
router.post('/transactions/withdraw', authMiddleware, authSpectator, SpectatorController.withdrawPoints);

// Protected routes - home feed & race viewing
router.get('/home-feed', authMiddleware, authSpectator, SpectatorController.getHomeFeed);
router.get('/race-schedule', authMiddleware, authSpectator, SpectatorController.getRaceSchedule);
router.get('/race-rounds/:raceRoundId/live', authMiddleware, authSpectator, SpectatorController.getLiveRaceDetail);

// Tournaments available for champion prediction (scheduled + ongoing)
router.get('/tournaments', authMiddleware, authSpectator, SpectatorController.getTournamentsForPrediction);

// All active prediction methods (optionally filtered by raceRoundId query param)
router.get('/prediction-methods', authMiddleware, authSpectator, SpectatorController.getAvailablePredictionMethods);

// Protected routes - predictions
router.post('/predictions', authMiddleware, authSpectator, SpectatorController.createPrediction);
router.get('/predictions', authMiddleware, authSpectator, SpectatorController.getMyPredictions);
router.get('/predictions/:predictionId', authMiddleware, authSpectator, SpectatorController.getPredictionDetail);

module.exports = router;
