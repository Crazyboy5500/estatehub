const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/webhook', paymentController.webhook);
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/:id/confirm', protect, paymentController.confirmPayment);
router.get('/my', protect, paymentController.getMyPayments);
router.get('/owner', protect, authorize('owner', 'admin'), paymentController.getOwnerPayments);
router.get('/all', protect, authorize('admin'), paymentController.getAllPayments);

module.exports = router;
