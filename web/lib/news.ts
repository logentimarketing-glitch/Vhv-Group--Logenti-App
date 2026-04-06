import { PortalNews, STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage, updateStorage, writeStorage } from "@/lib/storage";
import { addNotification, readNotifications, writeNotifications } from "@/lib/notifications";

const MODERATION_PREFIX = "Pendiente de aprobacion: ";

export function readNews() {
  return readStorage<PortalNews[]>(STORAGE_KEYS.news, []);
}

export function writeNews(items: PortalNews[]) {
  writeStorage(STORAGE_KEYS.news, items);
}

export function addModerationNotification(postTitle: string) {
  return addNotification({
    kind: "moderation",
    title: "Publicacion pendiente",
    message: `${MODERATION_PREFIX}${postTitle}`,
    targetMatriculas: undefined,
  });
}

export function clearModerationNotification(postTitle: string) {
  const next = readNotifications().filter(
    (item) => item.message !== `${MODERATION_PREFIX}${postTitle}`,
  );
  writeNotifications(next);
  return next;
}

export function getPendingNewsCount(items: PortalNews[]) {
  return items.filter((item) => item.status === "pendiente").length;
}
