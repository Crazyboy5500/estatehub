import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    pool: 'forks',
    env: {
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://127.0.0.1:27017/estatehub_test',
      PORT: '5100',
      JWT_SECRET: 'test-secret',
      RAZORPAY_KEY_ID: 'rzp_test_dummykey',
      RAZORPAY_KEY_SECRET: 'dummysecret',
    },
  },
});
