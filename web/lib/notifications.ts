import { STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage, writeStorage } from "@/lib/storage";

export type PortalNotification = {
  id: string;
  kind: "info" | "message" | "moderation" | "social";
  title: string;
  message: string;
  createdAt: string;
  targetMatriculas?: string[];
  readBy: string[];
};

export function readNotifications() {
  return readStorage<PortalNotification[]>(STORAGE_KEYS.notifications, []);
}

export function writeNotifications(items: PortalNotification[]) {
  writeStorage(STORAGE_KEYS.notifications, items);
}

export function addNotification(input: Omit<PortalNotification, "id" | "createdAt" | "readBy">) {
  const current = readNotifications();
  const next: PortalNotification[] = [
    {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      readBy: [],
      ...input,
    },
    ...current,
  ];
  writeNotifications(next);
  return next;
}

export function getNotificationsForUser(matricula: string) {
  return readNotifications().filter(
    (item) => !item.targetMatriculas || item.targetMatriculas.includes(matricula),
  );
}

export function getUnreadNotificationsCount(matricula: string) {
  return getNotificationsForUser(matricula).filter((item) => !item.readBy.includes(matricula)).length;
}

export function markNotificationRead(id: string, matricula: string) {
  const next = readNotifications().map((item) =>
    item.id === id && !item.readBy.includes(matricula)
      ? { ...item, readBy: [...item.readBy, matricula] }
      : item,
  );
  writeNotifications(next);
  return next;
}

export function markAllNotificationsRead(matricula: string) {
  const next = readNotifications().map((item) =>
    (!item.targetMatriculas || item.targetMatriculas.includes(matricula)) && !item.readBy.includes(matricula)
      ? { ...item, readBy: [...item.readBy, matricula] }
      : item,
  );
  writeNotifications(next);
  return next;
}
