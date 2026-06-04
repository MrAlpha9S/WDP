const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/RegistrationController');
const { authMiddleware, authHorseOwner } = require('../middlewares/authMiddleware');

// All registration routes require authentication
router.post('/', authMiddleware, RegistrationController.createRegistration);
router.get('/:id', authMiddleware, RegistrationController.getRegistrationById);
// Owner-specific list
router.get('/owner/:ownerId', authMiddleware, authHorseOwner, RegistrationController.getRegistrationsByOwnerId);
router.put('/:id', authMiddleware, RegistrationController.updateRegistration);

module.exports = router;
