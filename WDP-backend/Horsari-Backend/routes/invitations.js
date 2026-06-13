const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/InvitationController');
const { authMiddleware, authHorseOwner, authJockey } = require('../middlewares/authMiddleware');

// Get tournaments with rounds and invitations by a list of invitation IDs
// Example: GET /invitations/123,456/tournaments
router.get('/invitations/:invitationIds/tournaments', authMiddleware, InvitationController.getTournamentsWithRoundsAndInvitations);

// Create invitation (protected - horse owner)
router.post('/', authMiddleware, authHorseOwner, InvitationController.createInvitation);

// Get invitations for a horse owner (horse owner only)
router.get('/horseowner/:ownerId', authMiddleware, authHorseOwner, InvitationController.getInvitationsByOwnerId);

// Get invitation by id
router.get('/:id', authMiddleware, InvitationController.getInvitationById);

// Update invitation
router.put('/:id', authMiddleware, authHorseOwner, InvitationController.updateInvitation);

// Get invitations for a jockey (jockey only)
router.get('/jockey/:jockeyId', authMiddleware, authJockey, InvitationController.getInvitationsByJockeyId);

// Get tournaments for a specific jockey's invitations (only that jockey's invitations per round)
// Example: GET /tournaments/jockey/789
router.get('/tournaments/jockey/:jockeyId', authMiddleware, authJockey, InvitationController.getTournamentsWithRoundsAndInvitationsForJockey);

module.exports = router;
