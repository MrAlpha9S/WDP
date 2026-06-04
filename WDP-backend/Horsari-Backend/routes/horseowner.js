const express = require('express');
const HorseOwnerController = require('../controllers/HorseOwnerController');
const { authMiddleware, authHorseOwner, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/horseownerSwagger');

// Public routes
router.get('/all', HorseOwnerController.getAllHorseOwners);
router.get('/license/:licenseNumber', HorseOwnerController.getHorseOwnerByLicense);

// Public - create horse owner profile for existing user
router.post('/:uid', HorseOwnerController.createHorseOwner);

// Protected routes - Horse owner only
router.get('/profile', authMiddleware, authHorseOwner, HorseOwnerController.getHorseOwnerProfile);
router.put('/profile', authMiddleware, authHorseOwner, HorseOwnerController.updateHorseOwnerProfile);
router.get('/my-horses', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorses);
router.get('/my-horses/stats', authMiddleware, authHorseOwner, HorseOwnerController.getMyHorsesStats);
router.get('/my-horses/health/:healthStatus', authMiddleware, authHorseOwner, HorseOwnerController.getHorsesByHealthStatus);

module.exports = router;
