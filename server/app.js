const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');

const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const visitRoutes = require('./routes/visitRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'EstateHub API' });
});

app.use(
  cors({
    origin: [config.clientURL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(hpp());
if (config.env === 'development') app.use(morgan('dev'));

if (config.env !== 'test') {
  const apiMax = Number(process.env.RATE_LIMIT_MAX_API) || (config.env === 'production' ? 300 : 3000);
  const authMax = Number(process.env.RATE_LIMIT_MAX_AUTH) || (config.env === 'production' ? 30 : 200);
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later' },
  });
  app.use('/api/', apiLimiter);
  app.use(
    ['/api/auth/login', '/api/auth/register', '/api/auth/request-otp', '/api/auth/verify-otp', '/api/auth/forgot-password', '/api/auth/reset-password'],
    authLimiter
  );
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'EstateHub API is running', env: config.env })
);

app.get('/api/config', (req, res) =>
  res.json({
    success: true,
    googleClientId: config.google.clientId || '',
    razorpayKey: config.razorpay?.keyId || '',
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
