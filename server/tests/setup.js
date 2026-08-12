import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';

export const TEST_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/estatehub_test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
