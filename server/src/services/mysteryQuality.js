const fail = (message) => {
  throw new Error(`Mystery quality validation failed: ${message}`);
};

const nonBlank = (v) => typeof v === 'string' && v.trim().length > 0;

const escapeRegExp = (v) =>
  v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function validateMysteryQuality(raw, difficulty, DIFFICULTY) {
  const cfg = DIFFICULTY[difficulty];

  if (!cfg) fail('Unknown difficulty.');
  if (!nonBlank(raw?.title) || raw.title.trim().length < 3) fail('Invalid title.');
  if (!nonBlank(raw.story) || raw.story.trim().length < 80) fail('Story too short.');

  if (!Array.isArray(raw.timeline) || raw.timeline.length < 3)
    fail('At least three timeline events required.');

  if (!Array.isArray(raw.suspects) || raw.suspects.length !== cfg.suspects)
    fail(`Expected ${cfg.suspects} suspects.`);

  if (!Array.isArray(raw.evidence) || raw.evidence.length !== cfg.clues)
    fail(`Expected ${cfg.clues} evidence items.`);

  if (!Array.isArray(raw.hints) || raw.hints.length !== cfg.hints)
    fail(`Expected ${cfg.hints} hints.`);

  if (!Array.isArray(raw.evidenceReasoning) || raw.evidenceReasoning.length < 2)
    fail('At least two solution reasoning entries required.');

  const suspectIds = raw.suspects.map(s => s?.suspectId);
  const suspectNames = raw.suspects.map(s => String(s?.name || '').trim().toLowerCase());

  if (suspectIds.some(x => !nonBlank(x)) || new Set(suspectIds).size !== suspectIds.length)
    fail('Duplicate or missing suspect IDs.');

  if (suspectNames.some(x => !x) || new Set(suspectNames).size !== suspectNames.length)
    fail('Duplicate or missing suspect names.');

  for (const suspect of raw.suspects) {
    for (const field of ['name','role','description','publicStatement']) {
      if (!nonBlank(suspect[field])) fail(`Suspect missing ${field}.`);
    }
  }

  if (!suspectIds.includes(raw.culpritId))
    fail('Culprit does not exist in suspect list.');

  const evidenceIds = raw.evidence.map(e => e?.evidenceId);

  if (evidenceIds.some(x => !nonBlank(x)) || new Set(evidenceIds).size !== evidenceIds.length)
    fail('Duplicate or missing evidence IDs.');

  const expectedSuspects = Array.from(
    {length:cfg.suspects}, (_,i) => `s${i+1}`
  );

  const expectedEvidence = Array.from(
    {length:cfg.clues}, (_,i) => `e${i+1}`
  );

  if (expectedSuspects.some(x => !suspectIds.includes(x)))
    fail('Suspect IDs must follow s1...sN.');

  if (expectedEvidence.some(x => !evidenceIds.includes(x)))
    fail('Evidence IDs must follow e1...eN.');

  const counts = {chat:0,image:0,audio:0};
  const titles = new Set();

  for (const ev of raw.evidence) {
    if (!['chat','image','audio'].includes(ev.type))
      fail('Unsupported evidence type.');

    counts[ev.type]++;

    if (!nonBlank(ev.title) || !nonBlank(ev.teaser))
      fail('Evidence title or teaser missing.');

    const title = ev.title.trim().toLowerCase();

    if (titles.has(title)) fail('Duplicate evidence title.');
    titles.add(title);

    if (ev.type === 'chat') {
      if (!Array.isArray(ev.content?.messages) || ev.content.messages.length < 3)
        fail(`${ev.evidenceId} needs at least three chat messages.`);

      for (const m of ev.content.messages) {
        if (!nonBlank(m.sender) || !nonBlank(m.text) || !nonBlank(m.time))
          fail('Incomplete chat message.');
      }
    }

    if (ev.type === 'image') {
      if (!nonBlank(ev.content?.description) ||
          ev.content.description.length < 25)
        fail(`${ev.evidenceId} needs a detailed image description.`);

      if (!nonBlank(ev.imagePrompt) || ev.imagePrompt.length < 40)
        fail(`${ev.evidenceId} needs a detailed image prompt.`);
    }

    if (ev.type === 'audio') {
      const transcript = ev.transcript || ev.content?.transcript;

      if (!nonBlank(transcript) || transcript.trim().length < 100)
        fail(`${ev.evidenceId} needs a longer audio transcript.`);
    }
  }

  if (counts.chat !== cfg.chats ||
      counts.image !== cfg.images ||
      counts.audio !== cfg.audio) {
    fail(`Incorrect evidence category counts: ${JSON.stringify(counts)}`);
  }

  for (const event of raw.timeline) {
    if (!nonBlank(event.time) || !nonBlank(event.event))
      fail('Incomplete timeline event.');
  }

  for (const field of ['explanation','motive','opportunity']) {
    if (!nonBlank(raw[field]) || raw[field].trim().length < 30)
      fail(`Solution field ${field} is incomplete.`);
  }

  const reasoning = raw.evidenceReasoning.join(' ');
  const citations = [...reasoning.matchAll(/\[(e\d+)\]/gi)]
    .map(m => m[1].toLowerCase());

  const uniqueCitations = [...new Set(citations)];

  if (uniqueCitations.length < 2)
    fail('At least two different evidence IDs must support solution.');

  for (const id of uniqueCitations) {
    if (!evidenceIds.includes(id))
      fail(`Solution cites nonexistent evidence ${id}.`);
  }

  const culprit = raw.suspects.find(s => s.suspectId === raw.culpritId);
  const culpritName = String(culprit.name).trim();
  const culpritPattern = new RegExp(
    `\\b${escapeRegExp(culpritName)}\\b`, 'i'
  );

  for (const [index,hint] of raw.hints.entries()) {
    if (!nonBlank(hint) || hint.trim().length < 12)
      fail(`Hint ${index+1} is incomplete.`);

    if (culpritPattern.test(hint))
      fail(`Hint ${index+1} directly reveals culprit.`);
  }

  const publicText = [
    raw.title,
    raw.story,
    ...raw.suspects.flatMap(s => [s.description,s.publicStatement]),
    ...raw.evidence.flatMap(e => [
      e.title,e.teaser,e.content?.description,
      e.transcript,e.content?.transcript
    ])
  ].filter(nonBlank).join('\n').toLowerCase();

  const name = culpritName.toLowerCase();

  const leaks = [
    `${name} is the culprit`,
    `${name} did it`,
    `${name} is responsible`,
    `${name} committed the crime`
  ];

  if (leaks.some(x => publicText.includes(x)))
    fail('Player-facing content directly reveals culprit.');

  return raw;
}