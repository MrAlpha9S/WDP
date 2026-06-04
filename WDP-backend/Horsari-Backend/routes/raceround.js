const express = require('express');
const RaceRoundController = require('../controllers/RaceRoundController');
const { authMiddleware, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, authAdmin, RaceRoundController.createRaceRound);
router.get('/tournament/:tournamentId', authMiddleware, RaceRoundController.getRaceRoundsByTournamentId);
router.get('/:id', authMiddleware, RaceRoundController.getRaceRoundById);
router.get('/', authMiddleware, RaceRoundController.getAllRaceRounds);
router.put('/:id', authMiddleware, authAdmin, RaceRoundController.updateRaceRound);
router.delete('/:id', authMiddleware, authAdmin, RaceRoundController.deleteRaceRound);
router.get('/status', authMiddleware, RaceRoundController.getRaceRoundsByStatus);

module.exports = router;