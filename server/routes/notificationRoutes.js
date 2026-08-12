const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getMyNotifications);
router.get('/unread-count', protect, notificationController.getUnreadCount);
router.put('/read-all', protect, notificationController.markAllRead);
router.put('/:id/read', protect, notificationController.markRead);

module.exports = router;
