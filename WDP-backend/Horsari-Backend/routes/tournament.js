
const router = require('express').Router();
const AdminController = require('../controllers/AdminController');
const { authMiddleware,authAdmin } = require('../middlewares/authMiddleware');

require('../swagger/tournamentSwagger');

router.post('/', authMiddleware, authAdmin, AdminController.createTournament);
router.put('/:id', authMiddleware, authAdmin, AdminController.updateTournament);
router.delete('/:id', authMiddleware, authAdmin, AdminController.deleteTournament);
module.exports = router;