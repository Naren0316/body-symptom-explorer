// api-client.js
// Drop this into your existing `js/` folder alongside app.js, chatbot.js, etc.
// It's a plain ES module with no dependencies, matching the rest of the repo.
//
// Change API_BASE_URL once: to your local server while developing, then to
// your deployed backend URL (Day 6 of the roadmap).

const API_BASE_URL = "http://localhost:3001"; // TODO: swap for deployed URL later

let authToken = null; // kept in memory only — never localStorage (XSS risk)

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function signup(email, password) {
  const data = await request("/api/auth/signup", { method: "POST", body: { email, password } });
  setAuthToken(data.token);
  return data.user;
}

export async function login(email, password) {
  const data = await request("/api/auth/login", { method: "POST", body: { email, password } });
  setAuthToken(data.token);
  return data.user;
}

export function logout() {
  setAuthToken(null);
}

// report: { region, painType, swelling, durationDays, severity, triggers, notes }
export async function saveReport(report) {
  return request("/api/reports", { method: "POST", body: report, auth: true });
}

export async function getMyReports() {
  const data = await request("/api/reports/me", { auth: true });
  return data.reports;
}

// message: string, context: optional object (e.g. { region, priorAnswers })
export async function sendChatMessage(message, context) {
  return request("/api/chat", { method: "POST", body: { message, context } });
}
