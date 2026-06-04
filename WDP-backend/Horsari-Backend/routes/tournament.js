
const router = require('express').Router();
const TournamentController = require('../controllers/TournamentController');
const { authMiddleware,authAdmin } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, authAdmin, TournamentController.createTournament);
router.get('/', TournamentController.getTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.put('/:id', authMiddleware, authAdmin, TournamentController.updateTournament);
router.delete('/:id', authMiddleware, authAdmin, TournamentController.deleteTournament);
module.exports = router;