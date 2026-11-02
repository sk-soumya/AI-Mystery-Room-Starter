import MysteryCase from '../models/MysteryCase.js';
import CaseSolution from '../models/CaseSolution.js';
const memory = { cases: new Map(), solutions: new Map() };
let useMongo = false;
export function setStorageMode(enabled) { useMongo = enabled; }
export const storage = {
  async saveCase(data) { if (useMongo) return await MysteryCase.create(data); memory.cases.set(String(data._id), structuredClone(data)); return memory.cases.get(String(data._id)); },
  async getCase(id) { if (useMongo) return await MysteryCase.findById(id); return memory.cases.get(String(id)) || null; },
  async saveSolution(data) { if (useMongo) return await CaseSolution.create(data); memory.solutions.set(String(data.caseId), structuredClone(data)); return data; },
  async getSolution(id) { if (useMongo) return await CaseSolution.findOne({ caseId: String(id) }); return memory.solutions.get(String(id)) || null; },
  async updateEvidenceMedia(id, evidenceId, patch) {
    const allowed = ['mediaUrl', 'mediaStatus', 'mediaError', 'mediaGeneratedAt'];

    const entries = Object.entries(patch || {})
      .filter(([key]) => allowed.includes(key));

    if (!entries.length) return null;

    if (useMongo) {
      const set = Object.fromEntries(
        entries.map(([key, value]) => [`evidence.$.${key}`, value])
      );

      return await MysteryCase.updateOne(
        {
          _id: String(id),
          'evidence.evidenceId': String(evidenceId)
        },
        { $set: set }
      );
    }

    const current = memory.cases.get(String(id));

    if (!current) return null;

    const item = (current.evidence || []).find(
      ev => ev.evidenceId === evidenceId
    );

    if (!item) return null;

    for (const [key, value] of entries) {
      item[key] = value;
    }

    memory.cases.set(String(id), current);

    return current;
  },
  async updateCase(id, updater) {
    const current = await this.getCase(id); if (!current) return null;
    if (useMongo) { updater(current); await current.save(); return current; }
    const next = structuredClone(current); updater(next); memory.cases.set(String(id), next); return next;
  }
};
