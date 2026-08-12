const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken, generateToken, generateOTP, sendTokenResponse } = require('../utils/token');
const { sendVerificationEmail, sendResetPasswordEmail, sendOTPEmail } = require('../services/emailService');
const crypto = require('crypto');
const config = require('../config');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new AppError('An account with this email already exists', 400);

    const user = await User.create({
      name,
      email,
      password,
      role: ['buyer', 'owner'].includes(role) ? role : 'buyer',
      phone: phone || '',
    });

    const emailToken = generateToken();
    user.emailToken = emailToken;
    await user.save({ validateBeforeSave: false });

    if (user.email) {
      await sendVerificationEmail(user, emailToken);
    }

    sendTokenResponse(res, user, 201, { message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required', 400);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (user.isBlocked) throw new AppError('Your account has been blocked. Contact support.', 403);

    sendTokenResponse(res, user);
  } catch (error) {
    next(error);
  }
};

const { OAuth2Client } = require('google-auth-library');

let googleClient = null;
if (config.google.clientId) {
  googleClient = new OAuth2Client(config.google.clientId);
}

const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) throw new AppError('Google credential is required', 400);
    if (!googleClient) {
      throw new AppError('Google login is not configured (GOOGLE_CLIENT_ID missing)', 503);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new AppError('Could not verify Google identity', 401);

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (user) {
      if (user.isBlocked) throw new AppError('Your account has been blocked. Contact support.', 403);
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.isEmailVerified = true;
        if (!user.profileImage && payload.picture) user.profileImage = payload.picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        profileImage: payload.picture || '',
        isEmailVerified: true,
      });
    }

    sendTokenResponse(res, user);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailToken: token }).select('+emailToken');
    if (!user) throw new AppError('Invalid or expired verification token', 400);
    user.isEmailVerified = true;
    user.emailToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new AppError('No account found with this email', 404);
    if (user.isEmailVerified) return res.json({ success: true, message: 'Email already verified' });
    const emailToken = generateToken();
    user.emailToken = emailToken;
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user, emailToken);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new AppError('No account found with this email', 404);
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetToken = hashed;
    user.resetTokenExpires = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    await sendResetPasswordEmail(user, resetToken);
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetToken: hashed, resetTokenExpires: { $gt: Date.now() } }).select('+resetToken +resetTokenExpires');
    if (!user) throw new AppError('Invalid or expired reset token', 400);
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    sendTokenResponse(res, user);
  } catch (error) {
    next(error);
  }
};

const requestOTP = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new AppError('No account found with this email', 404);
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(user, otp);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpires');
    if (!user) throw new AppError('No account found with this email', 404);
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      throw new AppError('Invalid or expired OTP', 400);
    }
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(res, user);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'location', 'profileImage', 'role'];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (req.body.role && req.body.role !== req.user.role) {
      if (!['buyer', 'owner'].includes(req.body.role)) throw new AppError('Invalid role', 400);
      updates.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) throw new AppError('Current password is incorrect', 400);
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user._id);
    const index = user.favorites.indexOf(propertyId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(propertyId);
    }
    await user.save();
    const updated = await User.findById(req.user._id).populate('favorites');
    res.json({ success: true, favorites: updated.favorites });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  requestOTP,
  verifyOTP,
  getMe,
  updateMe,
  changePassword,
  toggleFavorite,
};
