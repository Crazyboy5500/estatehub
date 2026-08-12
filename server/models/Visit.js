const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    message: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'rescheduled', 'completed', 'cancelled'],
      default: 'pending',
    },
    rescheduleNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Visit || mongoose.model('Visit', visitSchema);
