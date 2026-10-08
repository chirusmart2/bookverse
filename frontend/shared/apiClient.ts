import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";
import type { ApiError, LoginResponse, User } from "./types";

const defaultApiBase = import.meta.env.DEV ? "/api/v1" : "http://127.0.0.1:5000/api/v1";
const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || defaultApiBase).replace(/\/+$/, "");
const API_BASE = configuredApiBase.endsWith("/api/v1")
  ? configuredApiBase
  : `${configuredApiBase}/api/v1`;
const API_REQUEST_TIMEOUT_MS = 90_000;

let refreshPromise: Promise<string | null> | null = null;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();

  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if ([204, 205, 304].includes(response.status)) return response;

    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (timedOut) {
      throw new Error("The BookVerse server is taking too long to respond. Please try again shortly.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach the BookVerse server. It may be waking up; please try again shortly.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body as ApiError;
    const detailMessages = Object.values(err.details ?? {}).flat().filter(Boolean);
    throw new Error(detailMessages.length
      ? detailMessages.join(" ")
      : err.message || `Request failed (${res.status})`);
  }
  return body as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
  }) =>
    apiFetch<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<{ user: User }>("/auth/me"),

  logout: (refreshToken: string) =>
    apiFetch<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};
