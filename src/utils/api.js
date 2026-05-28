const API_BASE = "http://localhost:5000";

export const getToken = () => localStorage.getItem("token");

// Generic fetch wrapper that auto-injects the JWT token
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  // Parse error messages from backend
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json();
};