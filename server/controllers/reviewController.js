const Review = require('../models/Review');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');

const createReview = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) throw new AppError('Rating and comment are required', 400);
    if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

    const property = await Property.findById(propertyId);
    if (!property) throw new AppError('Property not found', 404);
    if (property.ownerId.toString() === req.user._id.toString()) {
      throw new AppError('You cannot review your own property', 400);
    }

    const existing = await Review.findOne({ userId: req.user._id, propertyId });
    if (existing) throw new AppError('You have already reviewed this property', 400);

    const review = await Review.create({
      userId: req.user._id,
      propertyId,
      rating: Number(rating),
      comment,
    });

    const stats = await Review.aggregate([
      { $match: { propertyId: property._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    property.rating = stats[0] ? Math.round(stats[0].avg * 10) / 10 : rating;
    property.ratingCount = stats[0] ? stats[0].count : 1;
    property.reviews.push(review._id);
    await property.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const review = await Review.findById(id).populate('propertyId', 'ownerId');
    if (!review) throw new AppError('Review not found', 404);
    if (review.propertyId.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Only the property owner can reply', 403);
    }
    review.ownerReply = reply;
    review.ownerReplyAt = new Date();
    await review.save();
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const getPropertyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ propertyId: req.params.propertyId })
      .sort('-createdAt')
      .populate('userId', 'name profileImage');
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) throw new AppError('Review not found', 404);
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Not authorized to delete this review', 403);
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, replyToReview, getPropertyReviews, deleteReview };
