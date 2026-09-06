const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:11020/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const parsed = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !parsed) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message?: string }).message === "string"
        ? (parsed as { message: string }).message
        : fallbackMessage;
    throw new Error(message);
  }

  return parsed;
}
