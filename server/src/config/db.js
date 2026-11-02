import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.warn('⚠️  MONGODB_URI is empty. Using temporary in-memory store for this run. Data will be lost when the server restarts.');
    return false;
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ MongoDB connected');
  return true;
}
