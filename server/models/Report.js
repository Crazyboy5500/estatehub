const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['property', 'user'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType', required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ['open', 'reviewed', 'resolved', 'dismissed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
