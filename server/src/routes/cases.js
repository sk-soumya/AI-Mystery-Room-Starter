import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { storage } from '../services/storage.js';
import { generateCase, DIFFICULTY } from '../services/caseGenerator.js';
const router=Router();
const createSchema=z.object({premise:z.string().trim().min(20).max(1200),difficulty:z.enum(['easy','medium','hard'])});
const idError=()=>Object.assign(new Error('Case not found.'),{status:404});
function toId(doc){return String(doc._id);}
function publicCase(doc){
  const discovered=new Set(doc.progress?.discoveredEvidenceIds||[]);
  const evidence=(doc.evidence||[]).map(ev=>{
    const wasDiscovered=discovered.has(ev.evidenceId);
    const safeRecord={evidenceId:ev.evidenceId,type:ev.type,title:ev.title,teaser:ev.teaser,discovered:wasDiscovered};
    // Only return recovered contents after the player has opened that file.
    // This restores reviewed evidence after refresh without exposing sealed clues.
    if(wasDiscovered){
      safeRecord.content=ev.content||{};
      safeRecord.mediaUrl=ev.mediaUrl||null;
      safeRecord.transcript=ev.transcript||ev.content?.transcript||'';
      safeRecord.mediaStatus=ev.mediaStatus||'';
      safeRecord.generationMode=doc.generationMode||'demo';
    }
    return safeRecord;
  });
  return {caseId:toId(doc),title:doc.title,premise:doc.premise,difficulty:doc.difficulty,generationMode:doc.generationMode||'demo',status:doc.status,story:doc.story,timeline:doc.timeline,suspects:doc.suspects,evidence,hintsAllowed:doc.hintsAllowed,progress:{discoveredEvidenceIds:[...discovered],hintsUsed:doc.progress?.hintsUsed||0},createdAt:doc.createdAt};
}
router.post('/',async(req,res,next)=>{
 try {
  const input=createSchema.parse(req.body); const id=randomUUID();
  const generated=await generateCase(input.premise,input.difficulty,id);
  const caseDoc={_id:id,...generated.publicCase}; await storage.saveCase(caseDoc); await storage.saveSolution({caseId:id,...generated.solution});
  res.status(201).json({caseId:id,mode:generated.mode,message:generated.mode==='demo'?'Demo case created. Add a Gemini key to generate original AI mysteries.':'AI mystery generated successfully.'});
 } catch(err){next(err);}
});
router.get('/:id',async(req,res,next)=>{try{const doc=await storage.getCase(req.params.id);if(!doc)throw idError();if(doc.status==='completed')return res.status(409).json({message:'This case is completed. Open its results instead.'});res.json(publicCase(doc));}catch(e){next(e);}});
router.post('/:id/evidence/:evidenceId/discover',async(req,res,next)=>{try{
 const doc=await storage.getCase(req.params.id);if(!doc)throw idError();if(doc.status!=='ready')throw Object.assign(new Error('This case is not open for investigation.'),{status:409});
 const ev=doc.evidence.find(item=>item.evidenceId===req.params.evidenceId);if(!ev)throw Object.assign(new Error('Evidence not found.'),{status:404});
 await storage.updateCase(req.params.id,cur=>{cur.progress.discoveredEvidenceIds ||= [];if(!cur.progress.discoveredEvidenceIds.includes(ev.evidenceId))cur.progress.discoveredEvidenceIds.push(ev.evidenceId);});
 res.json({evidence:{evidenceId:ev.evidenceId,type:ev.type,title:ev.title,teaser:ev.teaser,content:ev.content,mediaUrl:ev.mediaUrl,transcript:ev.transcript,generationMode:doc.generationMode||'demo'},discoveredEvidenceCount:(await storage.getCase(req.params.id)).progress.discoveredEvidenceIds.length});
 }catch(e){next(e);}});
router.post('/:id/hints',async(req,res,next)=>{try{
 const doc=await storage.getCase(req.params.id);if(!doc)throw idError();if(doc.status!=='ready')throw Object.assign(new Error('Hints are unavailable for this case.'),{status:409});
 const requestKey=req.get('Idempotency-Key');if(!requestKey)throw Object.assign(new Error('Missing Idempotency-Key for hint request.'),{status:400});
 const existingIndex=(doc.progress.hintRequestKeys||[]).indexOf(requestKey);
 if(existingIndex>=0){const sameHint=doc.progress.hintsShown[existingIndex];return res.json({hint:sameHint,hintsUsed:doc.progress.hintsUsed,hintsRemaining:doc.hintsAllowed-doc.progress.hintsUsed,duplicate:true});}
 const sol=await storage.getSolution(req.params.id);if(!sol)throw new Error('Private solution record is missing.');
 if(doc.progress.hintsUsed>=doc.hintsAllowed)throw Object.assign(new Error('You have used all available hints.'),{status:400});
 const hint=sol.hints[doc.progress.hintsUsed];if(!hint)throw Object.assign(new Error('No more hints are available.'),{status:400});
 await storage.updateCase(req.params.id,cur=>{cur.progress.hintsUsed+=1;cur.progress.hintsShown ||= [];cur.progress.hintRequestKeys ||= [];cur.progress.hintsShown.push(hint);cur.progress.hintRequestKeys.push(requestKey);});
 res.json({hint,hintsUsed:doc.progress.hintsUsed+1,hintsRemaining:doc.hintsAllowed-doc.progress.hintsUsed-1});
 }catch(e){next(e);}});
router.post('/:id/accuse',async(req,res,next)=>{try{
 const body=z.object({suspectId:z.string().min(1)}).parse(req.body);const doc=await storage.getCase(req.params.id);if(!doc)throw idError();if(doc.status!=='ready'||doc.accusation?.submittedAt)throw Object.assign(new Error('An accusation has already been submitted or the case is closed.'),{status:409});
 if(!doc.suspects.some(s=>s.suspectId===body.suspectId))throw Object.assign(new Error('Select a valid suspect from this case.'),{status:400});
 const solution=await storage.getSolution(req.params.id);if(!solution)throw new Error('Private solution record is missing.');
 const isCorrect=body.suspectId===solution.culpritId;const basePoints=isCorrect?DIFFICULTY[doc.difficulty].base:0;const evidencePoints=(doc.progress.discoveredEvidenceIds||[]).length*5;const hintPenalty=(doc.progress.hintsUsed||0)*10;const total=Math.max(0,basePoints+evidencePoints-hintPenalty);
 await storage.updateCase(req.params.id,cur=>{cur.status='completed';cur.accusation={suspectId:body.suspectId,submittedAt:new Date(),isCorrect};cur.score={total,basePoints,evidencePoints,hintPenalty};cur.completedAt=new Date();});
 res.json({ok:true,redirect:`/case/${req.params.id}/result`});
 }catch(e){next(e);}});
router.get('/:id/result',async(req,res,next)=>{try{
 const doc=await storage.getCase(req.params.id);if(!doc)throw idError();if(doc.status!=='completed'||!doc.accusation?.submittedAt)throw Object.assign(new Error('Submit your final accusation before opening the result.'),{status:403});
 const solution=await storage.getSolution(req.params.id);if(!solution)throw new Error('Private solution record is missing.');
 const culprit=doc.suspects.find(s=>s.suspectId===solution.culpritId);
 res.json({caseId:toId(doc),title:doc.title,difficulty:doc.difficulty,selectedSuspect:doc.suspects.find(s=>s.suspectId===doc.accusation.suspectId),result:{isCorrect:doc.accusation.isCorrect,culprit:{suspectId:culprit.suspectId,name:culprit.name,role:culprit.role},score:doc.score,solution:{title:'The truth behind the case',explanation:solution.explanation,motive:solution.motive,opportunity:solution.opportunity,evidenceReasoning:solution.evidenceReasoning}}});
 }catch(e){next(e);}});
export default router;

