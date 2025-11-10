import mongoose from 'mongoose';
import { testConfig } from './helpers/config';

afterAll(async () => {
  const testDb = mongoose.createConnection(testConfig.MONGODB_URI);
  await testDb.dropDatabase();
  await mongoose.disconnect();
});
