import 'dotenv/config';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import MysteryCase from '../src/models/MysteryCase.js';
import CaseSolution from '../src/models/CaseSolution.js';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is empty in server/.env');
}

const id = `database-test-${randomUUID()}`;
let connected = false;

try {
  console.log('\nConnecting to MongoDB Atlas...');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000
  });

  connected = true;
  console.log('PASS: MongoDB connected.');

  await MysteryCase.create({
    _id: id,
    title: 'Temporary Database Test',
    premise: 'Temporary database verification.',
    difficulty: 'easy',
    status: 'ready',
    story: 'This record tests MongoDB persistence.',
    timeline: [
      { time: '09:00 AM', event: 'Database test started.' }
    ],
    suspects: [
      {
        suspectId: 'test-suspect-1',
        name: 'Test Suspect',
        role: 'Verification',
        description: 'Temporary test record.',
        publicStatement: 'Database verification.'
      }
    ],
    evidence: [
      {
        evidenceId: 'test-evidence-1',
        type: 'chat',
        title: 'Test Chat',
        teaser: 'Temporary verification evidence.',
        content: {
          messages: [
            {
              sender: 'Test',
              text: 'MongoDB works.',
              time: '09:01 AM'
            }
          ]
        }
      }
    ],
    hintsAllowed: 2,
    progress: {
      discoveredEvidenceIds: [],
      hintsUsed: 0,
      hintsShown: [],
      hintRequestKeys: []
    }
  });

  console.log('PASS: Mystery case saved.');

  await CaseSolution.create({
    caseId: id,
    culpritId: 'test-suspect-1',
    explanation: 'Temporary test explanation.',
    motive: 'Temporary test motive.',
    opportunity: 'Temporary test opportunity.',
    evidenceReasoning: ['Temporary test reasoning.'],
    hints: ['Test hint one.', 'Test hint two.']
  });

  console.log('PASS: Private solution saved separately.');

  const savedCase = await MysteryCase.findById(id).lean();
  const savedSolution = await CaseSolution.findOne({
    caseId: id
  }).lean();

  if (!savedCase || !savedSolution) {
    throw new Error('Database read verification failed.');
  }

  if (savedSolution.culpritId !== 'test-suspect-1') {
    throw new Error('Private solution verification failed.');
  }

  console.log('PASS: Database read verification.');

  const mutableCase = await MysteryCase.findById(id);
  mutableCase.progress.discoveredEvidenceIds.push('test-evidence-1');
  await mutableCase.save();

  const updated = await MysteryCase.findById(id).lean();

  if (!updated.progress.discoveredEvidenceIds.includes('test-evidence-1')) {
    throw new Error('Investigation progress was not saved.');
  }

  console.log('PASS: Investigation progress persisted.');

  console.log('\n======================================');
  console.log('MONGODB_PHASE2_TEST=PASSED');
  console.log('======================================');

} catch (error) {
  console.error('\nMONGODB_PHASE2_TEST=FAILED');
  console.error(error.message);
  process.exitCode = 1;

} finally {
  if (connected) {
    try {
      await MysteryCase.deleteOne({ _id: id });
      await CaseSolution.deleteOne({ caseId: id });
      console.log('Temporary test records deleted.');
    } catch (cleanupError) {
      console.warn('Temporary cleanup warning:', cleanupError.message);
    }

    await mongoose.disconnect();
  }
}