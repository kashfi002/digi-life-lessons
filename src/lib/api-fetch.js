export async function apiFetch(path, options = {}) {
  return fetch(`/api/proxy${path}`, {
    ...options,
    credentials: "include", // sends the session cookie so the proxy can read it server-side
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}