const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), analyticsController.getStats);
router.get('/properties-by-city', protect, authorize('admin'), analyticsController.propertiesByCity);
router.get('/monthly-listings', protect, authorize('admin'), analyticsController.monthlyListings);
router.get('/most-viewed', protect, authorize('admin'), analyticsController.mostViewed);
router.get('/avg-price', protect, authorize('admin'), analyticsController.avgPrice);
router.get('/most-saved', protect, authorize('admin'), analyticsController.mostSaved);
router.get('/visits-booked', protect, authorize('admin'), analyticsController.visitsBooked);
router.get('/recent-activity', protect, authorize('admin'), analyticsController.recentActivity);
router.get('/owner', protect, authorize('owner', 'admin'), analyticsController.ownerAnalytics);

module.exports = router;
