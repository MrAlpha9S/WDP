const express = require('express');
const AuthController = require('../controllers/AuthController');
const {
    authMiddleware,
    authorize,
} = require('../middlewares/authMiddleware');

// Import swagger documentation
require('../swagger/authSwagger');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google/login', AuthController.googleLogin);

// Protected routes
router.post('/google/login/additional-info', authMiddleware, AuthController.googleLoginAdditionalInfo);
router.get('/current-user', authMiddleware, AuthController.getCurrentUser);
router.get('/user/:id', authMiddleware, AuthController.getUserById);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
