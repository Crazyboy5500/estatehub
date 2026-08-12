const User = require('../models/User');
const Property = require('../models/Property');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');

const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { role, keyword } = req.query;

    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (keyword) filter.$or = [{ name: new RegExp(keyword, 'i') }, { email: new RegExp(keyword, 'i') }];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot block an admin', 400);
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, isBlocked: user.isBlocked });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot delete an admin', 400);
    await Property.deleteMany({ ownerId: user._id });
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) throw new AppError('targetType, targetId and reason are required', 400);
    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .sort('-createdAt')
      .populate('reporterId', 'name email')
      .populate('targetId');
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) throw new AppError('Report not found', 404);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, toggleBlockUser, deleteUser, createReport, getReports, resolveReport };
