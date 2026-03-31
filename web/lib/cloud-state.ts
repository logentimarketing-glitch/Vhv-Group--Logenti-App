export type RemoteAppState = {
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

export const CLOUD_TENANT = "main";

export function createEmptyRemoteState(): RemoteAppState {
  return {
    tenant: CLOUD_TENANT,
    members: [],
    news: [],
    courses: [],
    courseContent: [],
    connections: [],
    vacancies: [],
    candidates: [],
    supportThreads: [],
    profiles: {},
    updatedAt: new Date(0).toISOString(),
  };
}

export function hasCloudStateConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseRestUrl(path: string) {
  return `${process.env.SUPABASE_URL}/rest/v1/${path}`;
}

export function getSupabaseServiceHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    apikey: serviceRoleKey ?? "",
    Authorization: `Bearer ${serviceRoleKey ?? ""}`,
    "Content-Type": "application/json",
  };
}
