import api, { unwrap } from './api';

const crud = (path) => ({
  list: (params) => unwrap(api.get(path, { params })),
  get: (id) => unwrap(api.get(`${path}/${id}`)),
  create: (body) => unwrap(api.post(path, body)),
  update: (id, body) => unwrap(api.put(`${path}/${id}`, body)),
  remove: (id) => unwrap(api.delete(`${path}/${id}`)),
});

export const categoryService = crud('/categories');
export const budgetService = crud('/budgets');
export const peopleService = crud('/people');
export const goalService = crud('/goals');
export const recurringService = crud('/recurring');
export const notificationService = { list: () => unwrap(api.get('/notifications')) };
