import api, { unwrap } from './api';
export const register = (body) => unwrap(api.post('/auth/register', body));
export const login = (body) => unwrap(api.post('/auth/login', body));
export const me = () => unwrap(api.get('/auth/me'));
export const updateProfile = (body) => unwrap(api.put('/auth/me', body));
