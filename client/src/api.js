const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://ai-mystery-room-starter.onrender.com/api')).replace(/\/+$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const body = await response.text().catch(() => '');
    throw new Error(`The API returned a non-JSON response (HTTP ${response.status}). Check the backend URL. ${body.slice(0, 160)}`);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `API request failed (HTTP ${response.status}).`);
  return data;
}

export const api = {
  createCase: async (body) => {
    const data = await request('/cases', { method: 'POST', body: JSON.stringify(body) });
    if (!data.caseId) throw new Error('The backend did not return a case ID. Check the backend case-creation response.');
    return data;
  },
  getCase: (id) => request(`/cases/${encodeURIComponent(id)}`),
  discover: (id, evidenceId) => request(`/cases/${encodeURIComponent(id)}/evidence/${encodeURIComponent(evidenceId)}/discover`, { method: 'POST' }),
  hint: (id) => request(`/cases/${encodeURIComponent(id)}/hints`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  accuse: (id, suspectId) => request(`/cases/${encodeURIComponent(id)}/accuse`, { method: 'POST', body: JSON.stringify({ suspectId }) }),
  result: (id) => request(`/cases/${encodeURIComponent(id)}/result`),
  health: () => request('/health')
};