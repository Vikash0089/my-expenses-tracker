import api, { unwrap } from './api';
export const month = (p) => unwrap(api.get('/calendar', { params: p }));
export const day = (date) => unwrap(api.get(`/calendar/${date}`));
