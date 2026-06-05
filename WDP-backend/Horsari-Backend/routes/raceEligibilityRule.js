const express = require('express');
const router = express.Router();
const RaceEligibilityRuleController = require('../controllers/RaceEligibilityRuleController');
const { authMiddleware, authReferee } = require('../middlewares/authMiddleware');

// Protected route - Referee only
router.get('/', authMiddleware, authReferee, RaceEligibilityRuleController.getActiveRules);

module.exports = router;
