import { getProfileStorageKey, PROFILE_REGISTRY_KEY } from "@/lib/profile";
import { memberSeeds, STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage } from "@/lib/storage";

type RuntimeUser = {
  matricula: string;
};

export const CLOUD_SYNC_EVENT = "vhv-cloud-sync";
export const PROFILE_UPDATED_EVENT = "vhv-profiles-updated";
export const NEWS_UPDATED_EVENT = "vhv-news-updated";

export function buildCloudSnapshot(user: RuntimeUser | null) {
  const members = readStorage(STORAGE_KEYS.members, memberSeeds);
  const storedProfiles = readStorage<Record<string, unknown>>(PROFILE_REGISTRY_KEY, {});
  const profiles = { ...storedProfiles } as Record<string, unknown>;

  members.forEach((member) => {
    const key = getProfileStorageKey(member.matricula);
    const localProfile = readStorage(key, null);
    if (localProfile) {
      profiles[member.matricula] = localProfile;
    }
  });

  if (user) {
    const ownProfile = readStorage(getProfileStorageKey(user.matricula), null);
    if (ownProfile) {
      profiles[user.matricula] = ownProfile;
    }
  }

  profiles.__notifications__ = readStorage(STORAGE_KEYS.notifications, []);

  return {
    tenant: "main",
    members,
    news: readStorage(STORAGE_KEYS.news, []),
    courses: readStorage(STORAGE_KEYS.courses, []),
    courseContent: readStorage(STORAGE_KEYS.courseContent, []),
    connections: readStorage(STORAGE_KEYS.connections, []),
    vacancies: readStorage(STORAGE_KEYS.vacancies, []),
    candidates: readStorage(STORAGE_KEYS.candidates, []),
    supportThreads: readStorage(STORAGE_KEYS.support, []),
    profiles,
  };
}

export function dispatchCloudSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT));
}

export function dispatchProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
}

export function dispatchNewsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEWS_UPDATED_EVENT));
}
