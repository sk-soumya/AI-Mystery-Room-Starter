import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');

const safePart = (value) =>
  String(value || 'item')
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 80);

const publicUrl = (name) => `/uploads/${name}`;

async function saveFile(filename, bytes) {
  await fs.mkdir(uploadDir, { recursive: true });

  const finalPath = path.join(uploadDir, filename);
  const tempPath = `${finalPath}.${randomUUID()}.tmp`;

  await fs.writeFile(tempPath, bytes, { flag: 'wx' });
  await fs.rename(tempPath, finalPath);

  return publicUrl(filename);
}

// ============================================================
// GEMINI IMAGE GENERATION
// ============================================================

export async function generateImageEvidence(prompt, caseId, evidenceId) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini image generation is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

  const imagePrompt = [
    'Create one photorealistic fictional forensic evidence photograph for a detective mystery game.',
    'The image must depict only the clue described below.',
    'Preserve physical details and avoid inventing readable labels, timestamps, documents or extra clues.',
    'No text overlays, no added watermarks, no real identifiable people, no gore.',
    'Use documentary evidence photography with neutral lighting, clear focus and realistic materials.',
    `Evidence description: ${String(prompt || '').slice(0, 3500)}`
  ].join('\n');

  const response = await ai.models.generateContent({
    model,
    contents: imagePrompt,
    config: {
      responseModalities: ['Image']
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find(
    part => part.inlineData?.data
  );

  if (!imagePart) {
    throw new Error('Gemini returned no image data.');
  }

  const mimeType = String(
    imagePart.inlineData.mimeType || 'image/png'
  ).toLowerCase();

  const extensionByMime = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp'
  };

  const extension = extensionByMime[mimeType];

  if (!extension) {
    throw new Error(`Unsupported Gemini image type: ${mimeType}`);
  }

  const bytes = Buffer.from(
    imagePart.inlineData.data,
    'base64'
  );

  if (!bytes.length || bytes.length > 15 * 1024 * 1024) {
    throw new Error('Generated image was empty or exceeded 15 MB.');
  }

  const filename =
    `${safePart(caseId)}-${safePart(evidenceId)}-${Date.now()}.${extension}`;

  return saveFile(filename, bytes);
}

// ============================================================
// ELEVENLABS AUDIO GENERATION
// ============================================================

export async function generateAudioEvidence(script, caseId, evidenceId) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error('ElevenLabs audio generation is not configured.');
  }

  const text = String(script || '').trim();

  if (text.length < 20) {
    throw new Error('Audio transcript is too short.');
  }

  if (text.length > 3500) {
    throw new Error('Audio transcript exceeds 3500 characters.');
  }

  const timeoutMs = Math.min(
    120000,
    Math.max(15000, Number(process.env.AUDIO_TIMEOUT_MS) || 75000)
  );

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  let bytes;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.72
          }
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');

      throw new Error(
        `ElevenLabs request failed (${response.status}): ${detail.slice(0, 220)}`
      );
    }

    const contentType = (
      response.headers.get('content-type') || ''
    ).toLowerCase();

    if (
      contentType &&
      !contentType.includes('audio/') &&
      !contentType.includes('application/octet-stream')
    ) {
      throw new Error(`Unexpected audio content type: ${contentType}`);
    }

    bytes = Buffer.from(await response.arrayBuffer());

  } finally {
    clearTimeout(timer);
  }

  if (!bytes.length || bytes.length > 20 * 1024 * 1024) {
    throw new Error('Generated audio was empty or exceeded 20 MB.');
  }

  const filename =
    `${safePart(caseId)}-${safePart(evidenceId)}-${Date.now()}.mp3`;

  return saveFile(filename, bytes);
}