const express = require('express');
const SpectatorController = require('../controllers/SpectatorController');
const { authMiddleware, authSpectator } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/spectatorSwagger');

// Public
router.get('/top', SpectatorController.getTopSpectators);
router.get('/all', SpectatorController.getAllSpectators);
router.post('/:uid', SpectatorController.createSpectator);

// Profile
router.get('/profile', authMiddleware, authSpectator, SpectatorController.getSpectatorProfile);
router.put('/profile', authMiddleware, authSpectator, SpectatorController.updateSpectatorProfile);
router.put('/change-password', authMiddleware, authSpectator, SpectatorController.changePassword);

// Wallet & Transactions
router.get('/wallet', authMiddleware, authSpectator, SpectatorController.getWalletInfo);
router.get('/transactions', authMiddleware, authSpectator, SpectatorController.getTransactionHistory);
router.post('/transactions/deposit', authMiddleware, authSpectator, SpectatorController.depositPoints);
router.post('/transactions/withdraw', authMiddleware, authSpectator, SpectatorController.withdrawPoints);

// Legacy reward routes (kept for backward compat)
router.get('/rewards', authMiddleware, authSpectator, SpectatorController.getRewardPoints);
router.post('/rewards/add', authMiddleware, authSpectator, SpectatorController.addRewardPoints);
router.post('/rewards/deduct', authMiddleware, authSpectator, SpectatorController.deductRewardPoints);

// Home & Race
router.get('/home-feed', authMiddleware, authSpectator, SpectatorController.getHomeFeed);
router.get('/race-schedule', authMiddleware, authSpectator, SpectatorController.getRaceSchedule);
router.get('/race/:raceRoundId/live', authMiddleware, authSpectator, SpectatorController.getLiveRaceDetail);
router.get('/race/:raceRoundId/results', authMiddleware, authSpectator, SpectatorController.getRaceResult);
router.get('/race/:raceRoundId/leaderboard', authMiddleware, authSpectator, SpectatorController.getRaceLeaderboard);
router.get('/race/:raceRoundId/prediction-methods', authMiddleware, authSpectator, SpectatorController.getAvailablePredictionMethods);

// Predictions
router.post('/predictions', authMiddleware, authSpectator, SpectatorController.createPrediction);
router.get('/predictions', authMiddleware, authSpectator, SpectatorController.getMyPredictions);
router.get('/predictions/:predictionId', authMiddleware, authSpectator, SpectatorController.getPredictionDetail);

module.exports = router;
