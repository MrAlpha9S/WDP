const express = require('express');
const HorseController = require('../controllers/HorseController');
const { authMiddleware, authHorseOwner } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/horseSwagger');

// CRUD routes
// Create horse (protected)
router.post('/', authMiddleware, HorseController.createHorse);

// Get all horses
router.get('/', authMiddleware, HorseController.getAllHorses);

// Get horse by ID
router.get('/:id', authMiddleware, HorseController.getHorseById);

// Get horses by owner ID
router.get('/owner/:ownerId', authMiddleware, authHorseOwner, HorseController.getHorsesByOwnerId);

// Search horses by owner ID with keywords
router.post('/owner/:ownerId/search', authMiddleware, authHorseOwner, HorseController.searchHorsesByOwnerWithKeywords);

// Update horse (protected)
router.put('/:id', authMiddleware, authHorseOwner, HorseController.updateHorse);

// Delete horse (protected)
router.delete('/:id', authMiddleware, authHorseOwner, HorseController.deleteHorse);

// Get horse stats
router.get('/stats/all', authMiddleware, HorseController.getHorseStats);

module.exports = router;
