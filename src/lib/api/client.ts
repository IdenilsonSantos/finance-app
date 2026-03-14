import { getSession, signOut } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  workspaceId?: string;
};

// Prevent multiple concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) return null;

      const data: { access_token: string } = await res.json();
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  overrideToken?: string,
): Promise<T> {
  const session = await getSession();
  const { body, workspaceId, ...fetchOptions } = options;

  const accessToken = overrideToken ?? session?.accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const resolvedWorkspaceId = workspaceId ?? session?.workspaceId;
  if (resolvedWorkspaceId) {
    headers["x-workspace-id"] = resolvedWorkspaceId;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (response.status === 401 && !overrideToken) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return request<T>(path, options, newToken);
    }
    await signOut({ redirect: true, callbackUrl: "/sign-in" });
    throw new Error("Unauthorized");
  }

  if (response.status === 401) {
    await signOut({ redirect: true, callbackUrl: "/sign-in" });
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
