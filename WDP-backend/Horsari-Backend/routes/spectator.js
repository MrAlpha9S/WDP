const express = require('express');
const SpectatorProfileController = require('../controllers/spectator/ProfileController');
const SpectatorWalletController = require('../controllers/spectator/WalletController');
const SpectatorStatisticsController = require('../controllers/spectator/StatisticsController');
const SpectatorRaceController = require('../controllers/spectator/RaceController');
const SpectatorPredictionController = require('../controllers/spectator/PredictionController');
const { authMiddleware, authSpectator } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/spectatorSwagger');

// Protected routes - profile
router.get('/profile', authMiddleware, authSpectator, SpectatorProfileController.getSpectatorProfile);
router.put('/profile', authMiddleware, authSpectator, SpectatorProfileController.updateProfile);

// Protected routes - wallet
router.get('/wallet', authMiddleware, authSpectator, SpectatorWalletController.getWalletInfo);
router.get('/transactions', authMiddleware, authSpectator, SpectatorWalletController.getTransactionHistory);

// Protected routes - statistics
router.get('/statistics', authMiddleware, authSpectator, SpectatorStatisticsController.getStatistics);
router.get('/statistics/rewards-series', authMiddleware, authSpectator, SpectatorStatisticsController.getRewardsEarningsSeries);
// Mobile-compatible aliases
router.post('/transactions/deposit', authMiddleware, authSpectator, SpectatorWalletController.depositPoints);
router.post('/transactions/withdraw', authMiddleware, authSpectator, SpectatorWalletController.withdrawPoints);

// Protected routes - home feed & race viewing
router.get('/home-feed', authMiddleware, authSpectator, SpectatorRaceController.getHomeFeed);
router.get('/race-schedule', authMiddleware, authSpectator, SpectatorRaceController.getRaceSchedule);
router.get('/race-rounds/:raceRoundId/live', authMiddleware, authSpectator, SpectatorRaceController.getLiveRaceDetail);

// Tournaments available for champion prediction (scheduled + ongoing)
router.get('/tournaments', authMiddleware, authSpectator, SpectatorPredictionController.getTournamentsForPrediction);

// All active prediction methods (optionally filtered by raceRoundId query param)
router.get('/prediction-methods', authMiddleware, authSpectator, SpectatorPredictionController.getAvailablePredictionMethods);

// Protected routes - predictions
router.post('/predictions', authMiddleware, authSpectator, SpectatorPredictionController.createPrediction);
router.get('/predictions', authMiddleware, authSpectator, SpectatorPredictionController.getMyPredictions);
router.get('/predictions/:predictionId', authMiddleware, authSpectator, SpectatorPredictionController.getPredictionDetail);

module.exports = router;
