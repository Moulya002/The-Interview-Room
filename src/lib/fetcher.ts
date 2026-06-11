export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export class FetchError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Typed fetch wrapper that unwraps the `{ success, data }` envelope. */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new FetchError("Unexpected server response", res.status);
  }

  if (!res.ok || !json.success) {
    throw new FetchError(
      json.error ?? "Request failed",
      res.status,
      json.details,
    );
  }
  return json.data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
