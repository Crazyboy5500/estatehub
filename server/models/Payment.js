const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null },
    type: { type: String, enum: ['token', 'full'], required: true, index: true },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: 'INR' },
    tokenDeducted: { type: Number, default: 0 }, // paise deducted from full amount
    status: {
      type: String,
      enum: ['created', 'paid', 'confirmed', 'refunded', 'failed'],
      default: 'created',
      index: true,
    },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    refundId: { type: String, default: '' },
    refundedAt: { type: Date, default: null },
    commissionPercent: { type: Number, default: 0 },
    commissionPaise: { type: Number, default: 0 },
    ownerAmountPaise: { type: Number, default: 0 },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ buyerId: 1, propertyId: 1, type: 1, status: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
