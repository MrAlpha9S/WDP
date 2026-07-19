const express = require('express');
const AuthController = require('../controllers/AuthController');
const {
    authMiddleware,
    authorize,
} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { upload: avatarUpload } = require('../utils/CloudinaryUtil');

// Import swagger documentation
require('../swagger/authSwagger');

const router = express.Router();

// Public routes
router.post('/register', upload.single('license'), AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/current-user', authMiddleware, AuthController.getCurrentUser);
router.post('/avatar', authMiddleware, avatarUpload.single('image'), AuthController.uploadAvatar);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
