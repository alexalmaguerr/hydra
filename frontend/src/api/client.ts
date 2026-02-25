/**
 * Base URL for the backend API. When not set, the app uses DataContext (mock) only.
 */
const getBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001/api';
};

export const hasApi = (): boolean => true;

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('ctcf_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const j = JSON.parse(body);
      if (j.message) message = j.message;
    } catch {
      // use body as message
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export { getBaseUrl };
