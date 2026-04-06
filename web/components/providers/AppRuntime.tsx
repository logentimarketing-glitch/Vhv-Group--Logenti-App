"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { memberSeeds, STORAGE_KEYS } from "@/lib/portal-seeds";
import { getProfileStorageKey, PROFILE_REGISTRY_KEY } from "@/lib/profile";
import { readStorage, writeStorage } from "@/lib/storage";

type RuntimeUser = {
  matricula: string;
  name: string;
  role: "administrador" | "novato" | "usuario";
};

type AppRuntimeProps = {
  user: RuntimeUser | null;
  children: React.ReactNode;
};

type RemoteStatePayload = {
  tenant: string;
  members: unknown[];
  news: unknown[];
  courses: unknown[];
  courseContent: unknown[];
  connections: unknown[];
  vacancies: unknown[];
  candidates: unknown[];
  supportThreads: unknown[];
  profiles: Record<string, unknown>;
  updatedAt: string;
};

const NOTIFICATIONS_PROFILE_KEY = "__notifications__";

function hasContent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

function mergeListById<T extends { id: string; createdAt?: string }>(localItems: T[], remoteItems: T[]) {
  const merged = new Map<string, T>();

  for (const item of remoteItems) {
    merged.set(item.id, item);
  }

  for (const item of localItems) {
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
      continue;
    }

    const existingDate = Date.parse(existing.createdAt ?? "");
    const itemDate = Date.parse(item.createdAt ?? "");
    merged.set(item.id, Number.isNaN(itemDate) || existingDate > itemDate ? existing : item);
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aDate = Date.parse(a.createdAt ?? "");
    const bDate = Date.parse(b.createdAt ?? "");
    return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
  });
}

function mergeProfiles(
  localProfiles: Record<string, unknown>,
  remoteProfiles: Record<string, unknown>,
) {
  const merged = { ...remoteProfiles } as Record<string, unknown>;

  for (const [matricula, localValue] of Object.entries(localProfiles)) {
    const remoteValue = remoteProfiles[matricula];

    if (!remoteValue || typeof remoteValue !== "object" || remoteValue === null) {
      merged[matricula] = localValue;
      continue;
    }

    if (!localValue || typeof localValue !== "object") {
      continue;
    }

    const localProfile = localValue as Record<string, unknown>;
    const remoteProfile = remoteValue as Record<string, unknown>;

    merged[matricula] = {
      ...remoteProfile,
      ...localProfile,
      photoUrl: typeof localProfile.photoUrl === "string" && localProfile.photoUrl.trim()
        ? localProfile.photoUrl
        : remoteProfile.photoUrl,
      bio: typeof localProfile.bio === "string" && localProfile.bio.trim()
        ? localProfile.bio
        : remoteProfile.bio,
    };
  }

  return merged;
}

function buildLocalSnapshot(user: RuntimeUser | null) {
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

  profiles[NOTIFICATIONS_PROFILE_KEY] = readStorage(STORAGE_KEYS.notifications, []);

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

function hydrateFromRemote(remote: RemoteStatePayload, user: RuntimeUser | null) {
  const localSnapshot = buildLocalSnapshot(user);
  const mergedNews = mergeListById(
    (localSnapshot.news as Array<{ id: string; createdAt?: string }>) ?? [],
    (remote.news as Array<{ id: string; createdAt?: string }>) ?? [],
  );
  const mergedProfiles = mergeProfiles(
    (localSnapshot.profiles as Record<string, unknown>) ?? {},
    remote.profiles ?? {},
  );

  writeStorage(STORAGE_KEYS.members, remote.members);
  writeStorage(STORAGE_KEYS.news, mergedNews);
  writeStorage(STORAGE_KEYS.courses, remote.courses);
  writeStorage(STORAGE_KEYS.courseContent, remote.courseContent);
  writeStorage(STORAGE_KEYS.connections, remote.connections);
  writeStorage(STORAGE_KEYS.vacancies, remote.vacancies);
  writeStorage(STORAGE_KEYS.candidates, remote.candidates);
  writeStorage(STORAGE_KEYS.support, remote.supportThreads);
  const nextProfiles = { ...mergedProfiles } as Record<string, unknown>;
  const syncedNotifications = Array.isArray(nextProfiles[NOTIFICATIONS_PROFILE_KEY])
    ? nextProfiles[NOTIFICATIONS_PROFILE_KEY]
    : [];
  delete nextProfiles[NOTIFICATIONS_PROFILE_KEY];
  writeStorage(STORAGE_KEYS.notifications, syncedNotifications);
  writeStorage(PROFILE_REGISTRY_KEY, nextProfiles);

  Object.entries(nextProfiles).forEach(([matricula, profile]) => {
    writeStorage(getProfileStorageKey(matricula), profile);
  });

  if (user && remote.profiles?.[user.matricula]) {
    writeStorage(getProfileStorageKey(user.matricula), remote.profiles[user.matricula]);
  }
}

export function AppRuntime({ user, children }: AppRuntimeProps) {
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [syncLabel, setSyncLabel] = useState("Modo local");
  const snapshotRef = useRef("");
  const syncingRef = useRef(false);

  const syncUrl = useMemo(() => "/api/cloud/state", []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function bootstrapCloud() {
      try {
        const response = await fetch(syncUrl, { cache: "no-store" });
        const data = await response.json();

        if (cancelled) return;

        if (!data.cloudEnabled) {
          setCloudEnabled(false);
          setSyncLabel("Modo local");
          return;
        }

        setCloudEnabled(true);
        setSyncLabel("Nube activa");

        const localSnapshot = buildLocalSnapshot(user);
        const remoteState = data.state as RemoteStatePayload;
        const remoteHasData =
          hasContent(remoteState.members) ||
          hasContent(remoteState.news) ||
          hasContent(remoteState.vacancies) ||
          hasContent(remoteState.candidates) ||
          hasContent(remoteState.connections) ||
          hasContent(remoteState.profiles);

        const localHasData =
          hasContent(localSnapshot.members) ||
          hasContent(localSnapshot.news) ||
          hasContent(localSnapshot.vacancies) ||
          hasContent(localSnapshot.candidates) ||
          hasContent(localSnapshot.connections) ||
          hasContent(localSnapshot.profiles);

        if (remoteHasData) {
          hydrateFromRemote(remoteState, user);
          snapshotRef.current = JSON.stringify(buildLocalSnapshot(user));
        } else if (localHasData) {
          await fetch(syncUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localSnapshot),
          });
          snapshotRef.current = JSON.stringify(localSnapshot);
        }
      } catch {
        if (!cancelled) {
          setSyncLabel("Modo local");
        }
      }
    }

    bootstrapCloud();

    const interval = window.setInterval(async () => {
      if (!cloudEnabled || syncingRef.current) return;

      const nextSnapshot = JSON.stringify(buildLocalSnapshot(user));

      if (nextSnapshot === snapshotRef.current) return;

      syncingRef.current = true;

      try {
        await fetch(syncUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: nextSnapshot,
        });
        snapshotRef.current = nextSnapshot;
      } catch {
      } finally {
        syncingRef.current = false;
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [cloudEnabled, syncUrl, user]);

  return <>{children}</>;
}
