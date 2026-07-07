const express = require('express');
const RaceRoundController = require('../controllers/RaceRoundController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authAdmin, RaceRoundController.createRaceRound);
router.put('/:id', authMiddleware, authAdmin, RaceRoundController.updateRaceRound);
router.patch('/:id/cancel', authMiddleware, authAdmin, RaceRoundController.cancelRaceRound);

module.exports = router;