const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/InvitationController');
const { authMiddleware, authHorseOwner } = require('../middlewares/authMiddleware');

require('../swagger/invitationSwagger');

// Create invitation (protected - horse owner)
router.post('/', authMiddleware, authHorseOwner, InvitationController.createInvitation);

// Cancel a pending invitation the owner sent (protected - horse owner)
router.patch('/:id/cancel', authMiddleware, authHorseOwner, InvitationController.cancelInvitation);

module.exports = router;
