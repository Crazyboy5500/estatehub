const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.post('/property/:propertyId', protect, reviewController.createReview);
router.put('/:id/reply', protect, reviewController.replyToReview);
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
