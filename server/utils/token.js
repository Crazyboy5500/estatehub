const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const generateToken = () => crypto.randomBytes(24).toString('hex');

const generateOTP = () => String(crypto.randomInt(100000, 999999));

const sendTokenResponse = (res, user, statusCode = 200, extra = {}) => {
  res.status(statusCode).json({
    success: true,
    token: signToken(user._id),
    user: user.toSafeJSON(),
    ...extra,
  });
};

module.exports = { signToken, generateToken, generateOTP, sendTokenResponse };
