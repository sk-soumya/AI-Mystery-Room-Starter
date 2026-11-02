const API = '/api';
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}
export const api = {
  createCase: (body) => request('/cases', { method: 'POST', body: JSON.stringify(body) }),
  getCase: (id) => request(`/cases/${id}`),
  discover: (id, evidenceId) => request(`/cases/${id}/evidence/${evidenceId}/discover`, { method: 'POST' }),
  hint: (id) => request(`/cases/${id}/hints`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  accuse: (id, suspectId) => request(`/cases/${id}/accuse`, { method: 'POST', body: JSON.stringify({ suspectId }) }),
  result: (id) => request(`/cases/${id}/result`),
  health: () => request('/health')
};