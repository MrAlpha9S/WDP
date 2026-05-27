const express = require('express');
const CertificationController = require('../controllers/CertificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Import swagger documentation
require('../swagger/uploadSwagger');

const router = express.Router();

// Unified certification upload route
router.post(
    '/cert/user/:id',
    authMiddleware,
    upload.single('certification'),
    CertificationController.uploadCertification
);

module.exports = router;
