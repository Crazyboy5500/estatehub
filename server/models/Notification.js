const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['visit', 'message', 'property', 'system'], default: 'system' },
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
