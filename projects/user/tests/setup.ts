import mongoose from 'mongoose';

afterAll(async () => {
  const testDb = mongoose.createConnection('mongodb://localhost:27017/tests');
  await testDb.dropDatabase();
  await mongoose.disconnect();
});
