import mongoose from 'mongoose';
const CaseSolutionSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true, index: true }, culpritId: { type: String, required: true },
  explanation: String, motive: String, opportunity: String, evidenceReasoning: [String], hints: [String]
}, { timestamps: true });
export default mongoose.models.CaseSolution || mongoose.model('CaseSolution', CaseSolutionSchema);
