import api, { unwrap } from './api';
export const summary = (p) => unwrap(api.get('/dashboard/summary', { params: p }));
export const monthly = (p) => unwrap(api.get('/dashboard/monthly', { params: p }));
export const daily = (p) => unwrap(api.get('/dashboard/daily', { params: p }));
export const categories = (p) => unwrap(api.get('/dashboard/categories', { params: p }));
export const paymentMethods = (p) => unwrap(api.get('/dashboard/payment-methods', { params: p }));
