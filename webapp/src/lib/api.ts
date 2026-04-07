export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    let message = `GET ${path} failed`;
    try {
      const data = (await res.json()) as { code?: string; message?: string };
      if (data?.message) message = data.message;
      else if (data?.code) message = data.code;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `POST ${path} failed`;
    try {
      const data = (await res.json()) as { code?: string; message?: string };
      if (data?.message) message = data.message;
      else if (data?.code) message = data.code;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    let message = `DELETE ${path} failed`;
    try {
      const data = (await res.json()) as { code?: string; message?: string };
      if (data?.message) message = data.message;
      else if (data?.code) message = data.code;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
