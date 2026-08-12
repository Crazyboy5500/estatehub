const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.post('/conversations', protect, messageController.getOrCreateConversation);
router.get('/conversations', protect, messageController.getConversations);
router.get('/conversations/:conversationId', protect, messageController.getMessages);
router.post('/conversations/:conversationId/messages', protect, messageController.sendMessage);

module.exports = router;
