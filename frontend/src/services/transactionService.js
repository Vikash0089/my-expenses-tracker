import api, { unwrap } from './api';

// the list endpoint also returns pagination meta, so it resolves to { data, meta }
export const list = (params) => api.get('/transactions', { params }).then((r) => ({ items: r.data.data, meta: r.data.meta }));
export const get = (id) => unwrap(api.get(`/transactions/${id}`));
export const create = (body) => unwrap(api.post('/transactions', body));
export const update = (id, body) => unwrap(api.put(`/transactions/${id}`, body));
export const remove = (id) => unwrap(api.delete(`/transactions/${id}`));
export const uploadReceipt = (file) => {
  const form = new FormData();
  form.append('receipt', file);
  return unwrap(api.post('/transactions/receipt', form));
};
