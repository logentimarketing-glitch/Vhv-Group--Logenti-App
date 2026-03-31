"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEYS } from "@/lib/portal-seeds";
import { getProfileStorageKey } from "@/lib/profile";
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

function hasContent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

function buildLocalSnapshot(user: RuntimeUser | null) {
  const profileKey = user ? getProfileStorageKey(user.matricula) : null;
  const profiles =
    user && profileKey
      ? { [user.matricula]: readStorage(profileKey, {}) }
      : {};

  return {
    tenant: "main",
    members: readStorage(STORAGE_KEYS.members, []),
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
  writeStorage(STORAGE_KEYS.members, remote.members);
  writeStorage(STORAGE_KEYS.news, remote.news);
  writeStorage(STORAGE_KEYS.courses, remote.courses);
  writeStorage(STORAGE_KEYS.courseContent, remote.courseContent);
  writeStorage(STORAGE_KEYS.connections, remote.connections);
  writeStorage(STORAGE_KEYS.vacancies, remote.vacancies);
  writeStorage(STORAGE_KEYS.candidates, remote.candidates);
  writeStorage(STORAGE_KEYS.support, remote.supportThreads);

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
