import { normalizeMediaUrl } from "@/lib/media-links";

export type StoredProfile = {
  name: string;
  email: string;
  position: string;
  company: string;
  photoUrl: string;
  bio: string;
};

type ProfileUser = {
  matricula?: string;
  isMaster?: boolean;
  role: string;
  name: string;
  email: string;
  position: string;
  company?: string;
};

export function canUseProfilePhoto(user: Pick<ProfileUser, "matricula" | "isMaster" | "name" | "role">) {
  return user.role !== "novato";
}

export function getProfileStorageKey(matricula: string) {
  return `vhv-profile-${matricula}`;
}

export function getDefaultProfile(user: ProfileUser): StoredProfile {
  return {
    name: user.name,
    email: user.email,
    position: user.position,
    company: user.company ?? "",
    photoUrl: "",
    bio: "",
  };
}

export function resolveStoredProfile(user: ProfileUser, stored?: Partial<StoredProfile> | null): StoredProfile {
  const base = getDefaultProfile(user);
  const allowPhoto = canUseProfilePhoto(user);

  return {
    ...base,
    photoUrl:
      allowPhoto && typeof stored?.photoUrl === "string"
        ? normalizeMediaUrl(stored.photoUrl)
        : "",
    bio: typeof stored?.bio === "string" ? stored.bio : "",
  };
}

export function isProfileIncomplete(profile: StoredProfile, role?: string) {
  if (role === "novato") {
    return false;
  }

  return !profile.name.trim() || !profile.email.trim() || !profile.position.trim();
}
