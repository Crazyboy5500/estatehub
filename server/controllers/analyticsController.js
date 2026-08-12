const Property = require('../models/Property');
const User = require('../models/User');
const Visit = require('../models/Visit');
const Report = require('../models/Report');
const Message = require('../models/Message');
const { Conversation } = require('../models/Message');
const AppError = require('../utils/AppError');

const getStats = async (req, res, next) => {
  try {
    const [totalProperties, totalUsers, totalVisits, totalMessages, pendingVerification, totalRevenue] =
      await Promise.all([
        Property.countDocuments(),
        User.countDocuments(),
        Visit.countDocuments(),
        Message.countDocuments(),
        Property.countDocuments({ status: 'pending' }),
        Property.aggregate([
          { $match: { purpose: 'sale', status: { $in: ['verified', 'sold'] } } },
          { $group: { _id: null, total: { $sum: '$price' } } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        totalProperties,
        totalUsers,
        totalVisits,
        totalMessages,
        pendingVerification,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const propertiesByCity = async (req, res, next) => {
  try {
    const data = await Property.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const monthlyListings = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const data = await Property.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(`${year}-01-01`) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const mostViewed = async (req, res, next) => {
  try {
    const data = await Property.find().sort('-views').limit(5).select('title views city price images');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const avgPrice = async (req, res, next) => {
  try {
    const data = await Property.aggregate([
      { $match: { status: { $in: ['verified', 'sold'] } } },
      { $group: { _id: '$city', avgPrice: { $avg: '$price' } } },
      { $sort: { avgPrice: -1 } },
      { $limit: 10 },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const mostSaved = async (req, res, next) => {
  try {
    const users = await User.find({ favorites: { $ne: [] } }).select('favorites');
    const counts = {};
    users.forEach((u) => u.favorites.forEach((f) => (counts[f] = (counts[f] || 0) + 1)));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const data = [];
    for (const [id, count] of sorted) {
      const p = await Property.findById(id).select('title images city price');
      if (p) data.push({ property: p, favorites: count });
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const visitsBooked = async (req, res, next) => {
  try {
    const data = await Visit.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const recentActivity = async (req, res, next) => {
  try {
    const [properties, visits, reports] = await Promise.all([
      Property.find().sort('-createdAt').limit(5).populate('ownerId', 'name'),
      Visit.find().sort('-createdAt').limit(5).populate('buyerId', 'name').populate('propertyId', 'title'),
      Report.find().sort('-createdAt').limit(5).populate('reporterId', 'name'),
    ]);

    const activity = [
      ...properties.map((p) => ({
        type: 'property',
        text: `${p.ownerId?.name || 'Someone'} listed "${p.title}"`,
        createdAt: p.createdAt,
      })),
      ...visits.map((v) => ({
        type: 'visit',
        text: `${v.buyerId?.name || 'A buyer'} booked a visit for "${v.propertyId?.title || 'a property'}"`,
        createdAt: v.createdAt,
      })),
      ...reports.map((r) => ({
        type: 'report',
        text: `${r.reporterId?.name || 'A user'} reported content`,
        createdAt: r.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

const ownerAnalytics = async (req, res, next) => {
  try {
    const match = { ownerId: req.user._id };
    const [totalListings, activeListings, pendingVerification, soldProperties, visits, revenue, chart] =
      await Promise.all([
        Property.countDocuments(match),
        Property.countDocuments({ ...match, status: 'verified' }),
        Property.countDocuments({ ...match, status: 'pending' }),
        Property.countDocuments({ ...match, status: 'sold' }),
        Visit.countDocuments({ ownerId: req.user._id, status: 'accepted' }),
        Property.aggregate([{ $match: { ...match, status: 'sold' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
        Property.aggregate([
          { $match: match },
          { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        totalListings,
        activeListings,
        pendingVerification,
        soldProperties,
        visits,
        revenue: revenue[0]?.total || 0,
        chart,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  propertiesByCity,
  monthlyListings,
  mostViewed,
  avgPrice,
  mostSaved,
  visitsBooked,
  recentActivity,
  ownerAnalytics,
};
