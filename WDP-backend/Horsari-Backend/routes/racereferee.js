const express = require('express');
const RaceRefereeController = require('../controllers/RaceRefereeController');
const { authMiddleware, authAdmin, authReferee } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get assignments for a referee
router.get('/referee/:refereeId', authMiddleware, RaceRefereeController.getByReferee);

// Update status (assigned | rejected) - only assigned referee can do it
router.put('/:id/status', authMiddleware, authReferee, RaceRefereeController.setStatus);

module.exports = router;
