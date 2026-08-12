const Notification = require('../models/Notification');

const notifyUser = async ({ io, userId, type, message, link = '' }) => {
  try {
    const notification = await Notification.create({ userId, type, message, link });
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification.toObject());
    }
    return notification;
  } catch (error) {
    console.warn('Failed to create notification:', error.message);
    return null;
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort('-createdAt')
      .limit(30);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      const notFoundError = new Error('Notification not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { notifyUser, getMyNotifications, getUnreadCount, markRead, markAllRead };
