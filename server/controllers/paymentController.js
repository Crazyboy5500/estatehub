const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config');
const AppError = require('../utils/AppError');
const Payment = require('../models/Payment');
const { notifyUser } = require('./notificationController');
const { postSystemMessage } = require('./messageController');

let razorpay = null;
if (config.razorpay.keyId && config.razorpay.keySecret) {
  razorpay = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
}

const TOKEN_AMOUNT_PAISE = 50000; // ₹500 token payment
const MAX_ORDER_PAISE = 50000000; // Razorpay default limit: ₹5 lakh per transaction (raisable via support)

const getTokenPaid = async (buyerId, propertyId) => {
  const token = await Payment.findOne({
    buyerId,
    propertyId,
    type: 'token',
    status: { $in: ['paid', 'confirmed'] },
  }).sort('-createdAt');
  return token;
};

const createOrder = async (req, res, next) => {
  try {
    if (!razorpay) throw new AppError('Payments are not configured (RAZORPAY_KEY_ID missing)', 503);

    const { propertyId, visitId, type = 'token' } = req.body;
    if (!propertyId) throw new AppError('propertyId is required', 400);
    if (!['token', 'full'].includes(type)) throw new AppError('Invalid payment type', 400);

    const Property = require('../models/Property');
    const property = await Property.findById(propertyId);
    if (!property) throw new AppError('Property not found', 404);
    if (property.ownerId.toString() === req.user._id.toString()) {
      throw new AppError('You cannot pay on your own property', 400);
    }

    let amount = TOKEN_AMOUNT_PAISE;
    let tokenDeducted = 0;

    if (type === 'full') {
      if (property.purpose !== 'sale') {
        throw new AppError('Full payment is only available for properties on sale', 400);
      }
      if (property.status === 'sold') {
        throw new AppError('This property has already been sold', 400);
      }

      const existingFull = await Payment.findOne({
        propertyId,
        type: 'full',
        status: { $in: ['created', 'paid'] },
        buyerId: req.user._id,
      });
      if (existingFull) {
        throw new AppError('You already have a pending full payment for this property', 400);
      }

      amount = Math.round(property.price * 100);
      if (amount > MAX_ORDER_PAISE) {
        throw new AppError(
          `Full online payment is limited to ₹5 lakh per transaction (Razorpay limit). Contact the owner to complete this purchase, or raise the limit with Razorpay support.`,
          400
        );
      }
      const token = await getTokenPaid(req.user._id, propertyId);
      if (token) {
        tokenDeducted = TOKEN_AMOUNT_PAISE;
        amount = Math.max(amount - tokenDeducted, 0);
      }
    }

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `${type}_${propertyId}_${Date.now()}`,
      notes: { propertyId, visitId: visitId || '', userId: String(req.user._id), type },
    });

    const payment = await Payment.create({
      buyerId: req.user._id,
      ownerId: property.ownerId,
      propertyId,
      visitId: visitId || null,
      type,
      amount,
      tokenDeducted,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    if (!razorpay) throw new AppError('Payments are not configured', 503);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
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

    const payment = paymentId
      ? await Payment.findById(paymentId)
      : await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) throw new AppError('Payment record not found', 404);
    if (payment.razorpayOrderId !== razorpay_order_id) {
      throw new AppError('Payment order mismatch', 400);
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    const Property = require('../models/Property');
    const property = await Property.findById(payment.propertyId);

    if (payment.type === 'token') {
      const User = require('../models/User');
      const buyer = await User.findById(payment.buyerId);
      const owner = await User.findById(payment.ownerId);
      const buyerName = buyer?.name || 'A buyer';
      const ownerName = owner?.name || 'the owner';
      const chatText = `💸 Token payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} received for "${property?.title || 'your listing'}" — buyer: ${buyerName}, owner: ${ownerName}. Chat with each other here.`;
      const conversation = property && (await postSystemMessage({ io: req.app.get('io'), propertyId: property._id, senderId: payment.buyerId, receiverId: payment.ownerId, text: chatText }));
      const chatLink = conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/buyer';

      await notifyUser({
        io: req.app.get('io'),
        userId: payment.buyerId,
        type: 'system',
        message: '✅ Token payment successful. Your booking is confirmed.',
        link: chatLink,
      });
      if (property) {
        await notifyUser({
          io: req.app.get('io'),
          userId: payment.ownerId,
          type: 'system',
          message: `💳 ${buyerName} paid a ₹${(payment.amount / 100).toLocaleString('en-IN')} token for "${property.title}". You can message ${buyerName} here.`,
          link: conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/owner',
        });
      }
    } else {
      const User = require('../models/User');
      const buyer = await User.findById(payment.buyerId);
      const owner = await User.findById(payment.ownerId);
      const buyerName = buyer?.name || 'A buyer';
      const ownerName = owner?.name || 'the owner';
      const chatText = `💰 Full payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} received for "${property?.title || 'your listing'}" — buyer: ${buyerName}, owner: ${ownerName}. Awaiting owner confirmation.`;
      const conversation = property && (await postSystemMessage({ io: req.app.get('io'), propertyId: property._id, senderId: payment.buyerId, receiverId: payment.ownerId, text: chatText }));
      const chatLink = conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/buyer';

      await notifyUser({
        io: req.app.get('io'),
        userId: payment.buyerId,
        type: 'system',
        message: `✅ Full payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} successful. Awaiting owner confirmation.`,
        link: chatLink,
      });
      if (property) {
        await notifyUser({
          io: req.app.get('io'),
          userId: payment.ownerId,
          type: 'system',
          message: `💰 ${buyerName} made a full payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} for "${property.title}". Please confirm in your dashboard or chat with ${buyerName} here.`,
          link: conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/owner',
        });
      }
    }

    res.json({ success: true, message: 'Payment verified', paymentId: razorpay_payment_id });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) throw new AppError('Payment not found', 404);

    const Property = require('../models/Property');
    const property = await Property.findById(payment.propertyId);
    if (!property) throw new AppError('Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the property owner or admin can confirm payments', 403);
    }

    if (payment.type !== 'full') {
      throw new AppError('Token payments do not require confirmation', 400);
    }
    if (payment.status !== 'paid') {
      throw new AppError('Payment must be paid before confirmation', 400);
    }

    const commissionPaise = Math.round((payment.amount * config.razorpay.commissionPercent) / 100);
    const ownerAmountPaise = payment.amount - commissionPaise;

    payment.status = 'confirmed';
    payment.commissionPercent = config.razorpay.commissionPercent;
    payment.commissionPaise = commissionPaise;
    payment.ownerAmountPaise = ownerAmountPaise;
    payment.confirmedAt = new Date();
    payment.confirmedBy = req.user._id;
    await payment.save();

    property.status = 'sold';
    property.buyerId = payment.buyerId;
    await property.save();

    const chatText = `✅ ${req.user.name} confirmed your full payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} for "${property.title}". The property is now marked as sold.`;
    const conversation = await postSystemMessage({
      io: req.app.get('io'),
      propertyId: payment.propertyId,
      senderId: payment.ownerId,
      receiverId: payment.buyerId,
      text: chatText,
    });

    await notifyUser({
      io: req.app.get('io'),
      userId: payment.buyerId,
      type: 'system',
      message: `🎉 Your purchase of "${property.title}" has been confirmed by the owner.`,
      link: conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/buyer',
    });

    if (!isOwner) {
      await notifyUser({
        io: req.app.get('io'),
        userId: payment.ownerId,
        type: 'system',
        message: `🏁 "${property.title}" was marked as sold by ${req.user.name}. Net payout after commission: ₹${(ownerAmountPaise / 100).toLocaleString('en-IN')}.`,
        link: conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/owner',
      });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const isRefundCreditError = (err) =>
  err && err.statusCode === 400 && err.error && err.error.code === 'BAD_REQUEST_ERROR' && err.error.description === 'invalid request sent';

const refundWithFallback = async (paymentId, amountPaise) => {
  try {
    return await razorpay.payments.refund(paymentId, { amount: amountPaise, speed: 'normal' });
  } catch (err) {
    if (!isRefundCreditError(err) || amountPaise < 200) throw err;
    const chunkA = await refundWithFallback(paymentId, Math.floor(amountPaise / 2));
    const chunkB = await refundWithFallback(paymentId, amountPaise - Math.floor(amountPaise / 2));
    return chunkB;
  }
};

const refundPayment = async (req, res, next) => {
  try {
    if (!razorpay) throw new AppError('Payments are not configured (RAZORPAY_KEY_ID missing)', 503);
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) throw new AppError('Payment not found', 404);

    const Property = require('../models/Property');
    const property = await Property.findById(payment.propertyId);
    if (!property) throw new AppError('Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the property owner or admin can refund payments', 403);
    }

    if (payment.type !== 'token') {
      throw new AppError('Only token payments can be refunded', 400);
    }
    if (payment.status !== 'paid') {
      throw new AppError('Only paid token payments can be refunded', 400);
    }
    if (!payment.razorpayPaymentId) {
      throw new AppError('Payment is missing a Razorpay payment ID', 400);
    }

    const refund = await refundWithFallback(payment.razorpayPaymentId, payment.amount);

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundedAt = new Date();
    await payment.save();

    const chatText = `💸 Token payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} for "${property.title}" has been refunded by ${req.user.name}.`;
    const conversation = await postSystemMessage({
      io: req.app.get('io'),
      propertyId: payment.propertyId,
      senderId: payment.ownerId,
      receiverId: payment.buyerId,
      text: chatText,
    });

    await notifyUser({
      io: req.app.get('io'),
      userId: payment.buyerId,
      type: 'system',
      message: `💸 Your ₹${(payment.amount / 100).toLocaleString('en-IN')} token payment for "${property.title}" has been refunded.`,
      link: conversation ? `/dashboard/messages?conversation=${conversation._id}` : '/dashboard/buyer',
    });

    res.json({ success: true, data: payment, refund: { id: refund.id, status: refund.status } });
  } catch (error) {
    next(error);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ buyerId: req.user._id })
      .sort('-createdAt')
      .populate('propertyId', 'title images city address price purpose')
      .populate('ownerId', 'name phone email');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getOwnerPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ ownerId: req.user._id })
      .sort('-createdAt')
      .populate('propertyId', 'title images city address price purpose')
      .populate('buyerId', 'name phone email');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') throw new AppError('Admin access required', 403);
    const payments = await Payment.find()
      .sort('-createdAt')
      .populate('propertyId', 'title images city price purpose')
      .populate('buyerId', 'name email')
      .populate('ownerId', 'name email');

    const totals = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commissionPaise' },
          totalConfirmed: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: payments,
      totals: totals[0] || { totalCommission: 0, totalConfirmed: 0 },
    });
  } catch (error) {
    next(error);
  }
};

const webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;
    if (!config.razorpay.webhookSecret) {
      return res.status(503).json({ success: false, message: 'Webhook secret not configured' });
    }

    const expected = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event !== 'payment.captured') {
      return res.json({ success: true, received: event.event });
    }

    const payload = event.payload?.payment?.entity;
    if (!payload?.order_id) {
      return res.status(400).json({ success: false, message: 'Missing order_id' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: payload.order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    payment.razorpayPaymentId = payload.id;
    payment.status = 'paid';
    await payment.save();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  confirmPayment,
  refundPayment,
  getMyPayments,
  getOwnerPayments,
  getAllPayments,
  webhook,
  TOKEN_AMOUNT_PAISE,
};
