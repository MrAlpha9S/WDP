const express = require('express');
const RefereeController = require('../controllers/RefereeController');
const { authMiddleware, authReferee, authAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

require('../swagger/refereeSwagger');

// Public routes
router.get('/all', RefereeController.getAllReferees);
router.get('/credentials/:certificationNumber', RefereeController.getRefereeByCredentials);
router.get('/license/:licenseNumber', RefereeController.getRefereeByLicense);

// Public - create referee profile for existing user
router.post('/:uid', RefereeController.createReferee);

// Protected routes - Referee only
router.get('/profile', authMiddleware, authReferee, RefereeController.getRefereeProfile);
router.put('/profile', authMiddleware, authReferee, RefereeController.updateRefereeProfile);
router.post('/verify-credentials', authMiddleware, authReferee, RefereeController.verifyRefereeCredentials);
router.post('/renew-certification', authMiddleware, authReferee, RefereeController.renewCertification);

module.exports = router;
