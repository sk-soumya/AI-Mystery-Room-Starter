import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { generateImageEvidence, generateAudioEvidence } from './media.js';
import { validateMysteryQuality } from './mysteryQuality.js';

export const DIFFICULTY = {
  easy: { suspects: 3, clues: 5, chats: 2, images: 2, audio: 1, hints: 2, base: 100 },
  medium: { suspects: 4, clues: 7, chats: 3, images: 2, audio: 2, hints: 3, base: 150 },
  hard: { suspects: 5, clues: 9, chats: 3, images: 3, audio: 3, hints: 3, base: 200 }
};
const schema = z.object({
  title: z.string().min(3), story: z.string().min(30),
  timeline: z.array(z.object({ time: z.string(), event: z.string() })).min(3),
  suspects: z.array(z.object({ suspectId: z.string(), name: z.string(), role: z.string(), description: z.string(), publicStatement: z.string() })),
  evidence: z.array(z.object({ evidenceId: z.string(), type: z.enum(['chat','image','audio']), title: z.string(), teaser: z.string(), content: z.any(), transcript: z.string().optional(), imagePrompt: z.string().optional() })),
  culpritId: z.string(), explanation: z.string(), motive: z.string(), opportunity: z.string(), evidenceReasoning: z.array(z.string()).min(2), hints: z.array(z.string())
});

function demoCase(premise, difficulty) {
  const cfg = DIFFICULTY[difficulty];
  const people = [
    ['s1','Mira Sen','Event curator','Managed the private gallery and controlled the guest list.','I left the east corridor before the lights flickered.'],
    ['s2','Arjun Mehta','Security supervisor','Had access to the building cameras and service passages.','The west camera was offline, but I never entered the suite.'],
    ['s3','Nisha Rao','Restoration artist','Worked late and knew the item’s condition and hiding place.','I was in the restoration room until the storm passed.'],
    ['s4','Kabir Das','Private collector','Had tried to purchase the missing object several times.','I was on a call in the lobby when the alarm sounded.'],
    ['s5','Tara Bose','Night receptionist','Handled room keys and the visitor register.','I did not issue any duplicate key that evening.']
  ];
  const suspects = people.slice(0,cfg.suspects).map(([suspectId,name,role,description,publicStatement])=>({suspectId,name,role,description,publicStatement}));
  const types = [...Array(cfg.chats).fill('chat'), ...Array(cfg.images).fill('image'), ...Array(cfg.audio).fill('audio')];
  const titles = { chat:['Late-night messages','The deleted exchange','A message out of sequence','An unfamiliar number'], image:['Corridor photograph','Object detail','The service-door image'], audio:['Unsent voice note','Corridor call recording','Voicemail fragment'] };
  const evidence = types.map((type,i)=>{
    const title = titles[type][i % titles[type].length];
    if(type==='chat') return { evidenceId:`e${i+1}`,type,title,teaser:'A fictional message thread with a detail worth checking.',content:{messages:[{sender:'Mira',text:'The gallery closes at 9. Please use the staff entrance after that.',time:'8:41 PM'},{sender:'Arjun',text:'The corridor camera is still showing a delay.',time:'9:12 PM'},{sender:'Mira',text:'That is not what the maintenance log says.',time:'9:16 PM'},{sender:'Unknown',text:'You should have left the case where it was.',time:'9:18 PM'}]}};
    if(type==='image') return { evidenceId:`e${i+1}`,type,title,teaser:'A scene photograph. Inspect the details carefully.',content:{description:'A fictional evidence photograph connected to the incident. Look for access points, reflections, timestamps, and object placement.'},imagePrompt:`A moody but legible close-up evidence photograph for the mystery premise: ${premise}. Include subtle clues such as a wet shoeprint near a service door and a reflected clock, no people identifiable.`};
    const transcript = 'I told you the side entrance was locked. Someone must have known the keypad code before the power flickered. Check the time on the maintenance call.';
    return { evidenceId:`e${i+1}`,type,title,teaser:'A voice recording transcript with a timeline discrepancy.',transcript,content:{transcript}};
  });
  const culpritId = 's3';
  const hints = ['Compare each suspect’s stated location with the timeline and the corridor access evidence.','Focus on who knew the service entrance routine and could move during the camera delay.','The restoration room statement is the one that conflicts with the physical timeline.'];
  return { title:'The Midnight Paradox',story:`${premise} The storm interrupted the building’s power for four minutes. By morning, the missing item had vanished from a supposedly secure room. Your task is to compare statements, timestamps, and physical evidence. This is a fictional demo case.`,timeline:[{time:'8:40 PM',event:'The building closes to public visitors.'},{time:'9:12 PM',event:'A corridor camera begins reporting delayed footage.'},{time:'9:16 PM',event:'A power flicker interrupts the access log.'},{time:'9:20 PM',event:'The missing item is reported.'}],suspects,evidence,culpritId,explanation:'Nisha used her after-hours access and knowledge of the restoration schedule to approach the room during the camera delay. Her statement places her in the restoration room throughout the critical window, but the evidence timeline shows movement during that period.',motive:'Nisha wanted to conceal a restoration mistake that would have exposed an earlier unauthorized alteration.',opportunity:'Her work access allowed her to enter the service corridor during the camera delay.',evidenceReasoning:['The timestamped conversation shows advance knowledge of the camera delay.','The audio transcript places the side entrance and keypad code in the conversation before the outage.','The timeline conflicts with the restoration-room alibi.'],hints:hints.slice(0,cfg.hints)};
}

async function askGemini(premise, difficulty) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const cfg = DIFFICULTY[difficulty];
  const prompt = `Create a logically solvable, fully fictional detective mystery for a web game. User premise: ${premise}\nDifficulty: ${difficulty}. Exact counts required: ${cfg.suspects} suspects; ${cfg.clues} evidence items split into exactly ${cfg.chats} chat, ${cfg.images} image, and ${cfg.audio} audio items; exactly ${cfg.hints} hints.\nMake one culprit fixed and choose culpritId from suspectId. The player-facing suspects/evidence must not reveal culprit directly. Every major deduction must be supported by at least two independent evidence items. Add believable red herrings without contradictions. Chat evidence content must be {messages:[{sender,text,time}]}. Image evidence content must be {description}; also provide a detailed imagePrompt describing the clue visible in the image. Audio evidence must include a natural fictional transcript field. For hints, start subtle and become more direct, never state the culprit's name. Evidence IDs must be unique e1...e${cfg.clues}; suspect IDs s1...s${cfg.suspects}. All people, organisations, locations, messages, photographs, recordings and events are fictional. Return only JSON matching the requested schema.

CASE-LOGIC RULES (mandatory):
1. Choose exactly one culprit, motive, means and opportunity before writing evidence.
2. Create one consistent chronology and use it in all alibis and clues.
3. Give every suspect an understandable motive or reason for investigation.
4. The actual culprit must be deducible using at least two independent evidence items.
5. Every evidenceReasoning entry MUST cite real evidence IDs in square brackets, for example [e2].
6. Every chat must include at least three natural messages with sender, text and time.
7. Image descriptions and image prompts must depict the same clue.
8. Audio transcripts must contain at least 30 believable fictional words.
9. All timestamps must agree with the timeline.
10. Include fair red herrings that can be resolved through evidence.
11. Hints must progressively help the player without naming the culprit.
12. Never reveal the culprit in public-facing story, descriptions, chat or evidence titles.
13. Keep the actual culprit and solution in solution fields only.
14. Use exactly the required counts and IDs: suspects s1...sN and evidence e1...eN.
15. Return JSON only, without Markdown fences.`;
  const responseSchema = {
    type:'OBJECT', properties:{
      title:{type:'STRING'},story:{type:'STRING'},timeline:{type:'ARRAY',items:{type:'OBJECT',properties:{time:{type:'STRING'},event:{type:'STRING'}},required:['time','event']}},
      suspects:{type:'ARRAY',items:{type:'OBJECT',properties:{suspectId:{type:'STRING'},name:{type:'STRING'},role:{type:'STRING'},description:{type:'STRING'},publicStatement:{type:'STRING'}},required:['suspectId','name','role','description','publicStatement']}},
      evidence:{type:'ARRAY',items:{type:'OBJECT',properties:{evidenceId:{type:'STRING'},type:{type:'STRING',enum:['chat','image','audio']},title:{type:'STRING'},teaser:{type:'STRING'},content:{type:'OBJECT',properties:{messages:{type:'ARRAY',items:{type:'OBJECT',properties:{sender:{type:'STRING'},text:{type:'STRING'},time:{type:'STRING'}},required:['sender','text','time']}},description:{type:'STRING'} }},transcript:{type:'STRING'},imagePrompt:{type:'STRING'}},required:['evidenceId','type','title','teaser','content']}},
      culpritId:{type:'STRING'},explanation:{type:'STRING'},motive:{type:'STRING'},opportunity:{type:'STRING'},evidenceReasoning:{type:'ARRAY',items:{type:'STRING'}},hints:{type:'ARRAY',items:{type:'STRING'}}
    },required:['title','story','timeline','suspects','evidence','culpritId','explanation','motive','opportunity','evidenceReasoning','hints']
  };
  const response = await ai.models.generateContent({model:process.env.GEMINI_TEXT_MODEL||'gemini-3.5-flash-lite',contents:prompt,config:{responseMimeType:'application/json',responseSchema,temperature:0.35}});
  const raw = response.text || '';
  const parsed = JSON.parse(raw.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim());
  return validateMysteryQuality(schema.parse(parsed), difficulty, DIFFICULTY);
}

function normalizeGenerated(raw, difficulty) {
  const cfg=DIFFICULTY[difficulty];
  if(raw.suspects.length!==cfg.suspects) throw new Error(`AI returned ${raw.suspects.length} suspects; expected ${cfg.suspects}. Please retry.`);
  if(raw.evidence.length!==cfg.clues) throw new Error(`AI returned ${raw.evidence.length} evidence items; expected ${cfg.clues}. Please retry.`);
  if(raw.hints.length!==cfg.hints) throw new Error(`AI returned ${raw.hints.length} hints; expected ${cfg.hints}. Please retry.`);
  const counts={chat:0,image:0,audio:0}; raw.evidence.forEach(e=>counts[e.type]++);
  if(counts.chat!==cfg.chats||counts.image!==cfg.images||counts.audio!==cfg.audio) throw new Error('AI evidence category counts did not match the selected difficulty. Please retry.');
  if(!raw.suspects.some(s=>s.suspectId===raw.culpritId)) throw new Error('AI selected a culprit outside the suspect list. Please retry.');
  return raw;
}

function isTemporaryGeminiError(err) {
  const status = Number(err?.status || err?.code || err?.cause?.status);
  const message = `${err?.message || ''} ${err?.cause?.message || ''}`;
  return [408, 425, 429, 500, 502, 503, 504].includes(status)
    || /UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|timeout|timed out|ECONNRESET|fetch failed|high demand/i.test(message);
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`${label} timed out after ${ms}ms`), { code: 'ETIMEDOUT' })), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

export async function generateCase(premise, difficulty, caseId) {
  let raw;
  let mode = 'demo';
  let warning = null;
  const timeoutMs = Math.min(30000, Math.max(6000, Number(process.env.GEMINI_TIMEOUT_MS) || 12000));

  if (process.env.GEMINI_API_KEY) {
    try {
      raw = normalizeGenerated(await withTimeout(askGemini(premise, difficulty), timeoutMs, 'Gemini mystery generation'), difficulty);
      mode = 'gemini';
    } catch (err) {
      if (!isTemporaryGeminiError(err)) throw err;
      console.warn(`Gemini temporarily unavailable; returning a labelled demo case. ${err.message}`);
      raw = normalizeGenerated(demoCase(premise, difficulty), difficulty);
      warning = 'Gemini is temporarily busy. A clearly labelled demo case was opened so you can continue testing.';
    }
  } else {
    raw = normalizeGenerated(demoCase(premise, difficulty), difficulty);
    warning = 'Gemini API key is not configured. A clearly labelled demo case was opened.';
  }

  // Do not wait for image/audio providers before returning the case to the UI.
  const evidence = raw.evidence.map(ev => ({
    ...ev,
    mediaUrl: null,
    mediaStatus: mode === 'gemini' && ev.type === 'image' ? 'pending' : mode === 'gemini' && ev.type === 'audio' ? ((process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) ? 'pending' : 'not_configured') : 'not_applicable',
    mediaError: null,
    mediaGeneratedAt: null,
    transcript: ev.transcript || ev.content?.transcript || ''
  }));
  const mediaJobs = mode === 'gemini'
    ? raw.evidence.filter(ev => ev.type === 'image' || (ev.type === 'audio' && process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID))
    : [];

  return {
    publicCase: {
      title: raw.title,
      premise,
      difficulty,
      generationMode: mode,
      status: 'ready',
      story: raw.story,
      timeline: raw.timeline,
      suspects: raw.suspects,
      evidence,
      hintsAllowed: DIFFICULTY[difficulty].hints,
      progress: { discoveredEvidenceIds: [], hintsUsed: 0, hintsShown: [], hintRequestKeys: [] },
      accusation: { suspectId: null, submittedAt: null, isCorrect: null },
      score: { total: null, basePoints: null, evidencePoints: null, hintPenalty: null }
    },
    solution: {
      culpritId: raw.culpritId,
      explanation: raw.explanation,
      motive: raw.motive,
      opportunity: raw.opportunity,
      evidenceReasoning: raw.evidenceReasoning,
      hints: raw.hints
    },
    mode,
    warning,
    mediaJobs
  };
}

// Called after the case response is sent. Media work must never hold up case creation.
export function queueCaseMedia(caseId, mediaJobs, onMediaUpdate) {
  if (!Array.isArray(mediaJobs) || mediaJobs.length === 0) return;

  setImmediate(() => {
    let cursor = 0;
    const concurrency = Math.min(2, mediaJobs.length);

    const worker = async () => {
      while (true) {
        const index = cursor++;

        if (index >= mediaJobs.length) return;

        const ev = mediaJobs[index];

        const update = async (patch) => {
          try {
            await onMediaUpdate(ev.evidenceId, patch);
          } catch (updateError) {
            console.error(
              `Could not update media status for ${ev.evidenceId}:`,
              updateError.message
            );
          }
        };

        await update({
          mediaStatus: 'processing',
          mediaError: null
        });

        try {
          let task = null;

          if (ev.type === 'image') {
            task = generateImageEvidence(
              ev.imagePrompt || ev.content?.description || ev.teaser,
              caseId,
              ev.evidenceId
            );
          }

          if (ev.type === 'audio') {
            task = generateAudioEvidence(
              ev.transcript || ev.content?.transcript || ev.teaser,
              caseId,
              ev.evidenceId
            );
          }

          if (!task) {
            throw new Error(`No media provider available for ${ev.type}.`);
          }

          const timeoutMs = Math.min(
            150000,
            Math.max(30000, Number(process.env.MEDIA_TIMEOUT_MS) || 90000)
          );

          const mediaUrl = await withTimeout(
            task,
            timeoutMs,
            `${ev.type} evidence generation`
          );

          if (!mediaUrl) {
            throw new Error(`${ev.type} provider returned no media file.`);
          }

          await update({
            mediaUrl,
            mediaStatus: 'ready',
            mediaError: null,
            mediaGeneratedAt: new Date()
          });

          console.log(
            `Media ready: case=${caseId} evidence=${ev.evidenceId} type=${ev.type}`
          );

        } catch (err) {
          console.warn(
            `Background ${ev.type} generation failed for ${ev.evidenceId}:`,
            err.message
          );

          await update({
            mediaStatus: 'failed',
            mediaError: 'Media generation failed. Check backend logs before retrying.'
          });
        }
      }
    };

    void Promise.all(
      Array.from({ length: concurrency }, () => worker())
    ).catch(err => {
      console.error('Background media queue failed:', err.message);
    });
  });
}