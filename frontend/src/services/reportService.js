import api, { unwrap } from './api';

export const summary = (params) => unwrap(api.get('/reports', { params }));

export async function download(format, params) {
  const res = await api.get('/reports/export', { params: { ...params, format }, responseType: 'blob' });
  const match = /filename="?([^"]+)"?/.exec(res.headers['content-disposition'] || '');
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : `report.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
