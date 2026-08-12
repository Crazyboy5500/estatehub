const express = require('express');
const router = express.Router();
const {
  register, login, googleLogin, verifyEmail, resendVerification, forgotPassword, resetPassword,
  requestOTP, verifyOTP, getMe, updateMe, changePassword, toggleFavorite,
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.post('/favorites/:propertyId', protect, toggleFavorite);

module.exports = router;
