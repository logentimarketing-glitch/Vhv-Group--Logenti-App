import { PortalNews, STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage, updateStorage, writeStorage } from "@/lib/storage";

const MODERATION_PREFIX = "Pendiente de aprobacion: ";

export function readNews() {
  return readStorage<PortalNews[]>(STORAGE_KEYS.news, []);
}

export function writeNews(items: PortalNews[]) {
  writeStorage(STORAGE_KEYS.news, items);
}

export function addModerationNotification(postTitle: string) {
  return updateStorage<string[]>(STORAGE_KEYS.notifications, [], (current) => [
    `${MODERATION_PREFIX}${postTitle}`,
    ...current,
  ]);
}

export function clearModerationNotification(postTitle: string) {
  return updateStorage<string[]>(STORAGE_KEYS.notifications, [], (current) =>
    current.filter((item) => item !== `${MODERATION_PREFIX}${postTitle}`),
  );
}

export function getPendingNewsCount(items: PortalNews[]) {
  return items.filter((item) => item.status === "pendiente").length;
}
