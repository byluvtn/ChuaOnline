const KEY = 'co:session';
export const getToken = () => localStorage.getItem(KEY) || '';
export const setToken = (t: string) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);

async function post<T>(path: string, body: unknown = {}, auth = true): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error((data as any).error || 'Lỗi mạng'), { status: res.status });
  return data as T;
}

export const api = {
  guest: () => post<{ token: string }>('/api/guest', {}, false),
  register: (username: string, password: string) => post<{ token: string }>('/api/register', { username, password }),
  login: (username: string, password: string) => post<{ token: string }>('/api/login', { username, password }, false),
  logout: () => post('/api/logout'),
  me: () => post<import('../shared/types').Profile>('/api/me'),
};
