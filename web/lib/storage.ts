export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function updateStorage<T>(key: string, fallback: T, updater: (current: T) => T) {
  const current = readStorage(key, fallback);
  const next = updater(current);
  writeStorage(key, next);
  return next;
}
