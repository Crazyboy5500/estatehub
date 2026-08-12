require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

if (env === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production. Set it in the environment variables.');
}

module.exports = {
  env,
  port: process.env.PORT || 5001,
  mongoURI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/estatehub',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'EstateHub <no-reply@estatehub.dev>',
  },
  clientURL: process.env.CLIENT_URL || 'http://localhost:5173',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectURI: process.env.GOOGLE_REDIRECT_URI || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    commissionPercent: Number(process.env.ADMIN_COMMISSION_PERCENT) || 2,
  },
};
