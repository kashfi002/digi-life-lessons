const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function getAuthToken() {
  try {
    const res = await fetch("/api/auth/token", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}