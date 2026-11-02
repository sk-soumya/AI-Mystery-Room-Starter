import mongoose from 'mongoose';
const TimelineSchema = new mongoose.Schema({ time: String, event: String }, { _id: false });
const SuspectSchema = new mongoose.Schema({ suspectId: { type: String, required: true }, name: String, role: String, description: String, publicStatement: String }, { _id: false });
const EvidenceSchema = new mongoose.Schema({
  evidenceId: { type: String, required: true }, type: { type: String, enum: ['chat','image','audio'], required: true },
  title: String, teaser: String, content: mongoose.Schema.Types.Mixed, mediaUrl: String, mediaStatus: { type: String, enum: ['not_applicable','not_configured','pending','processing','ready','failed'], default: 'not_applicable' }, mediaError: String, mediaGeneratedAt: Date, mediaRetryCount: { type: Number, default: 0 }, transcript: String
}, { _id: false });
const MysteryCaseSchema = new mongoose.Schema({
  _id: { type: String },
  title: { type: String, required: true }, premise: { type: String, required: true }, difficulty: { type: String, enum: ['easy','medium','hard'], required: true },
  generationMode: { type: String, enum: ['gemini','demo'], default: 'demo' },
  status: { type: String, enum: ['generating','ready','failed','completed'], default: 'ready' }, story: String,
  timeline: [TimelineSchema], suspects: [SuspectSchema], evidence: [EvidenceSchema], hintsAllowed: Number,
  progress: { discoveredEvidenceIds: { type: [String], default: [] }, hintsUsed: { type: Number, default: 0 }, hintsShown: { type: [String], default: [] }, hintRequestKeys: { type: [String], default: [] } },
  accusation: { suspectId: { type: String, default: null }, submittedAt: { type: Date, default: null }, isCorrect: { type: Boolean, default: null } },
  score: { total: { type: Number, default: null }, basePoints: { type: Number, default: null }, evidencePoints: { type: Number, default: null }, hintPenalty: { type: Number, default: null } }
}, { timestamps: true });
export default mongoose.models.MysteryCase || mongoose.model('MysteryCase', MysteryCaseSchema);
