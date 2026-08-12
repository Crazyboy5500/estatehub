const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { protect } = require('../middleware/auth');

router.post('/property/:propertyId', protect, visitController.bookVisit);
router.get('/my', protect, visitController.getMyBookings);
router.get('/owner', protect, visitController.getOwnerVisits);
router.put('/:id', protect, visitController.respondToVisit);

module.exports = router;
