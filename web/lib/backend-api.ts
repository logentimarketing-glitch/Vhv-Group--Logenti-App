const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  "";

export function hasBackendUrl() {
  return Boolean(BACKEND_URL);
}

export async function backendPost(
  path: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return response;
}
