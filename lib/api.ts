export type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

export function getApiBase(): string {
  if (typeof window === 'undefined')
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/v1';
  return localStorage.getItem('bpmn_api_base') || 'http://localhost:3000/v1';
}

export function setApiBase(url: string) {
  if (typeof window !== 'undefined') localStorage.setItem('bpmn_api_base', url);
}

export function getToken(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_BEARER || '';
  return localStorage.getItem('bpmn_bearer') || '';
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bpmn_bearer', token);
    // Mirror into a cookie so middleware can read it server-side
    document.cookie = `bpmn_bearer=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`; // 7 days
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bpmn_bearer');
    // Expire the cookie
    document.cookie = 'bpmn_bearer=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchJson<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function toDeepQuery(filter: Record<string, any>): string {
  const params: string[] = [];
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null || v === '') continue;
    params.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return params.length ? `?${params.join('&')}` : '';
}
