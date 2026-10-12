import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

function getApiBaseUrl() {
  if (configuredBaseUrl) return configuredBaseUrl;
  if (process.env.NODE_ENV === "development") return "http://localhost:8081";

  // `next start` runs with NODE_ENV=production even when used on a developer's machine.
  // Keep local production builds usable without allowing a localhost fallback on deployed hosts.
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:8081";
  }

  throw new Error("NEXT_PUBLIC_API_BASE_URL must be set for this environment.");
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl().replace(/\/+$/, "")}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined" && isSupabaseConfigured() && !headers.has("Authorization")) {
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new Error(body?.detail ?? body?.message ?? `API 요청 실패 (${response.status}): ${response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
