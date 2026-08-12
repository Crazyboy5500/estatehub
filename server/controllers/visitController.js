const Visit = require('../models/Visit');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const { notifyUser } = require('./notificationController');

const bookVisit = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { date, time, message } = req.body;

    if (!date || !time) throw new AppError('Date and time are required', 400);

    const property = await Property.findById(propertyId);
    if (!property) throw new AppError('Property not found', 404);
    if (property.ownerId.toString() === req.user._id.toString()) {
      throw new AppError('You cannot book a visit on your own property', 400);
    }

    const visit = await Visit.create({
      buyerId: req.user._id,
      ownerId: property.ownerId,
      propertyId,
      date: new Date(date),
      time,
      message: message || '',
      status: 'pending',
    });

    await notifyUser({
      io: req.app.get('io'),
      userId: property.ownerId,
      type: 'visit',
      message: `${req.user.name} requested a visit for "${property.title}" on ${new Date(visit.date).toLocaleDateString('en-IN')} at ${visit.time}`,
      link: '/dashboard/visits',
    });

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const visits = await Visit.find({ buyerId: req.user._id })
      .sort('-createdAt')
      .populate('propertyId', 'title images price city address type purpose')
      .populate('ownerId', 'name phone profileImage');
    res.json({ success: true, data: visits });
  } catch (error) {
    next(error);
  }
};

const getOwnerVisits = async (req, res, next) => {
  try {
    const visits = await Visit.find({ ownerId: req.user._id })
      .sort('-createdAt')
      .populate('propertyId', 'title images city address')
      .populate('buyerId', 'name phone email profileImage');
    res.json({ success: true, data: visits });
  } catch (error) {
    next(error);
  }
};

const respondToVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rescheduleNote, date, time } = req.body;

    if (!['accepted', 'rejected', 'rescheduled', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const visit = await Visit.findById(id);
    if (!visit) throw new AppError('Visit not found', 404);

    const isOwner = visit.ownerId.toString() === req.user._id.toString();
    const isBuyer = visit.buyerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (isBuyer) {
      if (status !== 'cancelled') {
        throw new AppError('Buyers can only cancel their own visit requests', 403);
      }
    } else if (!isOwner && !isAdmin) {
      throw new AppError('Not authorized to update this visit', 403);
    }

    visit.status = status;
    if (status === 'rescheduled') {
      visit.rescheduleNote = rescheduleNote || '';
      if (date) visit.date = new Date(date);
      if (time) visit.time = time;
    }
    await visit.save();

    const statusMessages = {
      accepted: 'accepted',
      rejected: 'rejected',
      rescheduled: 'rescheduled',
      completed: 'marked as completed',
      cancelled: 'cancelled',
    };

    await notifyUser({
      io: req.app.get('io'),
      userId: visit.buyerId,
      type: 'visit',
      message: `The owner ${statusMessages[status] || status} your visit request for ${visit.date ? new Date(visit.date).toLocaleDateString('en-IN') : ''}${status === 'rescheduled' && visit.time ? ` at ${visit.time}` : ''}`,
      link: '/dashboard/buyer',
    });

    res.json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookVisit, getMyBookings, getOwnerVisits, respondToVisit };
