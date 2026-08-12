const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', propertyController.getProperties);
router.get('/featured', propertyController.getFeaturedProperties);
router.get('/latest', propertyController.getLatestProperties);
router.get('/cities', propertyController.getCities);
router.get('/trending', propertyController.trendingProperties);
router.get('/my', protect, authorize('owner', 'admin'), propertyController.getMyProperties);
router.get('/:id/similar', propertyController.getSimilarProperties);
router.get('/:id', propertyController.getProperty);

const uploadFields = [
  { name: 'images', maxCount: 12 },
  { name: 'video', maxCount: 1 },
];

router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  upload.fields(uploadFields),
  propertyController.createProperty
);

router.put(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  upload.fields(uploadFields),
  propertyController.updateProperty
);

router.delete('/:id', protect, authorize('owner', 'admin'), propertyController.deleteProperty);
router.put('/:id/status', protect, authorize('admin'), propertyController.updateStatus);

module.exports = router;
