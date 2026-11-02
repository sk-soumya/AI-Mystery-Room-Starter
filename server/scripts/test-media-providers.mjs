import 'dotenv/config';
import fs from 'node:fs/promises';
import {
  generateImageEvidence,
  generateAudioEvidence
} from '../src/services/media.js';

const BASE = 'http://localhost:5000';

async function testProvider(name, task) {
  console.log(`\nTESTING ${name}...`);

  try {
    const url = await Promise.race([
      task,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Provider timed out')), 120000)
      )
    ]);

    if (!url || !url.startsWith('/uploads/')) {
      throw new Error('Provider did not return a valid media URL.');
    }

    const filePath = new URL(
      `http://localhost:5000${url}`
    );

    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Media server returned HTTP ${response.status}`);
    }

    const bytes = await response.arrayBuffer();

    if (bytes.byteLength < 1000) {
      throw new Error('Generated media file is unexpectedly small.');
    }

    console.log(`${name}_TEST=PASSED`);
    console.log(`URL: ${url}`);
    console.log(`File size: ${bytes.byteLength} bytes`);

    return true;

  } catch (error) {
    console.error(`${name}_TEST=FAILED`);
    console.error(error.message);
    return false;
  }
}

const imageOK = await testProvider(
  'GEMINI_IMAGE',
  generateImageEvidence(
    'A highly realistic overhead forensic photograph of a hotel executive office desk at midnight. A partially burned paper receipt, a silver access card and a handwritten maintenance note are arranged naturally. Neutral evidence photography, realistic shadows, no people, no text overlays.',
    'media-provider-test',
    'image-test'
  )
);

const audioOK = await testProvider(
  'ELEVENLABS_AUDIO',
  generateAudioEvidence(
    'I saw someone leaving the executive office shortly before midnight. The lights had gone out, and the security system was not responding. I noticed a strange access card near the emergency exit. Please check the maintenance records before accusing anyone. I am sure the timing is important.',
    'media-provider-test',
    'audio-test'
  )
);

console.log('\n================================');
console.log('PHASE 4 PROVIDER TEST RESULTS');
console.log('================================');
console.log('Gemini Image:', imageOK ? 'PASS' : 'FAIL');
console.log('ElevenLabs Audio:', audioOK ? 'PASS' : 'FAIL');

if (imageOK && audioOK) {
  console.log('PHASE4_PROVIDER_TEST=PASSED');
} else {
  console.log('PHASE4_PROVIDER_TEST=NEEDS_FIX');
}