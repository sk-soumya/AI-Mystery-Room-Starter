import 'dotenv/config';
import mongoose from 'mongoose';
import MysteryCase from '../src/models/MysteryCase.js';

const id = 'a49c9d2a-97f1-428c-981f-59fcce4660cb';

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  });

  const result = await MysteryCase.updateOne(
    { _id: id },
    { $set: { generationMode: 'gemini' } }
  );

  if (result.matchedCount !== 1) {
    throw new Error('Previously generated case was not found.');
  }

  const doc = await MysteryCase.findById(id).lean();

  if (doc.generationMode !== 'gemini') {
    throw new Error('Generation mode persistence verification failed.');
  }

  console.log('GEMINI_MODE_PERSISTENCE=PASSED');
  console.log('Existing case correctly marked as Gemini-generated.');

} catch (error) {
  console.error('GEMINI_MODE_PERSISTENCE=FAILED');
  console.error(error.message);
  process.exitCode = 1;

} finally {
  await mongoose.disconnect().catch(() => {});
}