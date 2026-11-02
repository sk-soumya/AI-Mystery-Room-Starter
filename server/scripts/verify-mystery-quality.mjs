import assert from 'node:assert/strict';
import { validateMysteryQuality } from '../src/services/mysteryQuality.js';

const D = {
  easy:{suspects:3,clues:5,chats:2,images:2,audio:1,hints:2},
  medium:{suspects:4,clues:7,chats:3,images:2,audio:2,hints:3},
  hard:{suspects:5,clues:9,chats:3,images:3,audio:3,hints:3}
};

const valid = {
  title:'The Gallery After Midnight',
  story:'A private gallery closed after a storm, but an antique miniature vanished from a locked display room. Five people had access, and the entry log contains a seven-minute gap.',
  timeline:[
    {time:'8:40 PM',event:'The public gallery closes and guest doors are locked.'},
    {time:'9:12 PM',event:'A maintenance override is recorded near the east corridor.'},
    {time:'9:19 PM',event:'A staff member reports the display case is empty.'}
  ],
  suspects:[
    {suspectId:'s1',name:'Mira Sen',role:'Curator',description:'Managed the gallery schedule and guest list.',publicStatement:'I left before the maintenance override.'},
    {suspectId:'s2',name:'Arjun Mehta',role:'Security lead',description:'Had access to building controls.',publicStatement:'I remained at the front desk during the incident.'},
    {suspectId:'s3',name:'Nisha Rao',role:'Restorer',description:'Worked on the display object earlier that week.',publicStatement:'I was in the workshop after closing.'}
  ],
  evidence:[
    {evidenceId:'e1',type:'chat',title:'Staff group chat',teaser:'A staff exchange from closing time.',content:{messages:[
      {sender:'Mira',text:'The east corridor is closed tonight.',time:'8:50 PM'},
      {sender:'Arjun',text:'The override log should show that.',time:'9:02 PM'},
      {sender:'Nisha',text:'I did not request an override.',time:'9:04 PM'}
    ]}},
    {evidenceId:'e2',type:'chat',title:'Unsent message',teaser:'A recovered unsent staff message.',content:{messages:[
      {sender:'Nisha',text:'The case was moved before the room closed.',time:'8:56 PM'},
      {sender:'Mira',text:'Who moved it?',time:'8:57 PM'},
      {sender:'Nisha',text:'Check the workshop register.',time:'8:58 PM'}
    ]}},
    {evidenceId:'e3',type:'image',title:'Workshop threshold photo',teaser:'A photograph of the workshop entrance.',content:{description:'A small smear of blue restoration pigment appears on the inside edge of the workshop threshold.'},imagePrompt:'Photorealistic fictional evidence photograph showing a small blue restoration pigment smear on the inside edge of an old gallery workshop threshold, documentary evidence photography.'},
    {evidenceId:'e4',type:'image',title:'Display case detail',teaser:'A close-up of the display case lock.',content:{description:'The display case lock has a fresh scratch beneath the keyway, consistent with a hurried key insertion.'},imagePrompt:'Photorealistic close-up fictional forensic photograph of a museum display case lock, with a subtle fresh scratch below the keyway, natural gallery lighting.'},
    {evidenceId:'e5',type:'audio',title:'Workshop voice note',teaser:'A recovered voice note from the workshop.',transcript:'I was asked to return the miniature before the gallery opened tomorrow. The workshop register has the exact time, and the east corridor override was not part of my shift. I remember the clock was already past nine when I heard the case alarm.',content:{transcript:'I was asked to return the miniature before the gallery opened tomorrow. The workshop register has the exact time, and the east corridor override was not part of my shift. I remember the clock was already past nine when I heard the case alarm.'}}
  ],
  culpritId:'s2',
  explanation:'Arjun used his access to the building controls to create the maintenance override and remove the miniature during the blind interval. The records and physical trace establish his access and opportunity.',
  motive:'Arjun intended to sell the miniature to cover a personal debt after learning its appraised value.',
  opportunity:'His security role gave him the credentials needed to create the override while the front desk was unattended.',
  evidenceReasoning:[
    '[e1] The group chat establishes that Arjun knew the east corridor override would be recorded.',
    '[e4] The lock photograph supports a hurried entry during the override window.',
    '[e5] The voice note places the alarm after the workshop register entry.'
  ],
  hints:[
    'Compare the override time with each suspect statement and the lock photograph.',
    'Focus on who had access credentials during the seven-minute gap.'
  ]
};

assert.equal(
  validateMysteryQuality(valid,'easy',D).culpritId,
  's2'
);
console.log('PASS: Valid mystery accepted.');

const duplicate = structuredClone(valid);
duplicate.evidence[1].evidenceId='e1';

assert.throws(
  ()=>validateMysteryQuality(duplicate,'easy',D),
  /Duplicate or missing evidence IDs/
);
console.log('PASS: Duplicate evidence rejected.');

const badCitation = structuredClone(valid);
badCitation.evidenceReasoning=[
  '[e1] First clue.',
  '[e99] Missing clue.'
];

assert.throws(
  ()=>validateMysteryQuality(badCitation,'easy',D),
  /cites nonexistent evidence/
);
console.log('PASS: Invalid evidence reference rejected.');

const leakedHint = structuredClone(valid);
leakedHint.hints[0]='Arjun Mehta is the person to accuse.';

assert.throws(
  ()=>validateMysteryQuality(leakedHint,'easy',D),
  /directly reveals culprit/
);
console.log('PASS: Culprit-revealing hint rejected.');

console.log('MYSTERY_QUALITY_TEST=PASSED');