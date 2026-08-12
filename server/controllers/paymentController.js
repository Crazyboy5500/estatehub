const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config');
const AppError = require('../utils/AppError');
const { notifyUser } = require('./notificationController');

let razorpay = null;
if (config.razorpay.keyId && config.razorpay.keySecret) {
  razorpay = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
}

const TOKEN_AMOUNT_PAISE = 50000; // ₹500 token payment

const createOrder = async (req, res, next) => {
  try {
    if (!razorpay) throw new AppError('Payments are not configured (RAZORPAY_KEY_ID missing)', 503);

    const { propertyId, visitId } = req.body;
    if (!propertyId) throw new AppError('propertyId is required', 400);

    const order = await razorpay.orders.create({
      amount: TOKEN_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `token_${propertyId}_${Date.now()}`,
      notes: { propertyId, visitId: visitId || '', userId: String(req.user._id) },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    if (!razorpay) throw new AppError('Payments are not configured', 503);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, propertyId, visitId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing payment verification data', 400);
    }

    const expected = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      throw new AppError('Payment signature verification failed', 400);
    }

    await notifyUser({
      io: req.app.get('io'),
      userId: req.user._id,
      type: 'system',
      message: '✅ Token payment successful. Your booking is confirmed.',
      link: '/dashboard/buyer',
    });

    if (propertyId) {
      const Property = require('../models/Property');
      const property = await Property.findById(propertyId);
      if (property) {
        await notifyUser({
          io: req.app.get('io'),
          userId: property.ownerId,
          type: 'system',
          message: `💳 ${req.user.name} paid a ₹500 token for "${property.title}"`,
          link: '/dashboard/owner',
        });
      }
    }

    res.json({ success: true, message: 'Payment verified', paymentId: razorpay_payment_id });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, TOKEN_AMOUNT_PAISE };
