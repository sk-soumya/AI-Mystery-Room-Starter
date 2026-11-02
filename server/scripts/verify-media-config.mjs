import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const uploads = path.resolve(here, '../uploads');

const checks = [
  ['Gemini API key', Boolean(process.env.GEMINI_API_KEY)],
  ['Gemini image model setting/default', Boolean(process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image')],
  ['ElevenLabs API key', Boolean(process.env.ELEVENLABS_API_KEY)],
  ['ElevenLabs Voice ID', Boolean(process.env.ELEVENLABS_VOICE_ID)]
];

for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

fs.mkdirSync(uploads, { recursive: true });

console.log(`PASS: Local media folder exists (${uploads}).`);

if (checks.some(([,ok]) => !ok)) {
  console.error('MEDIA_CONFIGURATION_TEST=FAILED');
  process.exitCode = 1;
} else {
  console.log('MEDIA_CONFIGURATION_TEST=PASSED');
}