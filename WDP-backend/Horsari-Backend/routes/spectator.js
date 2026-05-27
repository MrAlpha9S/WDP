const express = require('express');
const SpectatorController = require('../controllers/SpectatorController');
const { authMiddleware, authSpectator, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/spectatorSwagger');

// Public routes
router.get('/top', SpectatorController.getTopSpectators);
router.get('/all', SpectatorController.getAllSpectators);

// Public - create spectator profile for existing user
router.post('/:uid', SpectatorController.createSpectator);

// Protected routes - Spectator only
router.get('/profile', authMiddleware, authSpectator, SpectatorController.getSpectatorProfile);
router.put('/profile', authMiddleware, authSpectator, SpectatorController.updateSpectatorProfile);
router.get('/rewards', authMiddleware, authSpectator, SpectatorController.getRewardPoints);
router.post('/rewards/add', authMiddleware, authSpectator, SpectatorController.addRewardPoints);
router.post('/rewards/deduct', authMiddleware, authSpectator, SpectatorController.deductRewardPoints);

module.exports = router;
