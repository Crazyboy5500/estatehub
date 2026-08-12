const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), userController.getUsers);
router.put('/:id/block', protect, authorize('admin'), userController.toggleBlockUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

router.post('/reports', protect, userController.createReport);
router.get('/reports', protect, authorize('admin'), userController.getReports);
router.put('/reports/:id', protect, authorize('admin'), userController.resolveReport);

module.exports = router;
