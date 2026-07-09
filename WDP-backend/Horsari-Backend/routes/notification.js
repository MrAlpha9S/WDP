const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Any authenticated, active user (any role) can manage their own notifications
router.get('/', authMiddleware, NotificationController.listMine);
router.get('/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.patch('/mark-all-read', authMiddleware, NotificationController.markAllRead);
router.patch('/:id/read', authMiddleware, NotificationController.markRead);

module.exports = router;
