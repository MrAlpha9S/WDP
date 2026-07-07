const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/InvitationController');
const { authMiddleware, authHorseOwner } = require('../middlewares/authMiddleware');

// Create invitation (protected - horse owner)
router.post('/', authMiddleware, authHorseOwner, InvitationController.createInvitation);

module.exports = router;
