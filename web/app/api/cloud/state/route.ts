import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  CLOUD_TENANT,
  createEmptyRemoteState,
  getSupabaseRestUrl,
  getSupabaseServiceHeaders,
  hasCloudStateConfig,
  type RemoteAppState,
} from "@/lib/cloud-state";

async function fetchRemoteState() {
  const response = await fetch(
    `${getSupabaseRestUrl(`app_state?tenant=eq.${CLOUD_TENANT}&select=*`)}`,
    {
      headers: getSupabaseServiceHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`No se pudo leer app_state: ${response.status}`);
  }

  const rows = (await response.json()) as Array<{
    tenant: string;
    members: unknown[];
    news: unknown[];
    courses: unknown[];
    course_content: unknown[];
    connections: unknown[];
    vacancies: unknown[];
    candidates: unknown[];
    support_threads: unknown[];
    profiles: Record<string, unknown>;
    updated_at: string;
  }>;

  const row = rows[0];

  if (!row) {
    return createEmptyRemoteState();
  }

  return {
    tenant: row.tenant,
    members: row.members ?? [],
    news: row.news ?? [],
    courses: row.courses ?? [],
    courseContent: row.course_content ?? [],
    connections: row.connections ?? [],
    vacancies: row.vacancies ?? [],
    candidates: row.candidates ?? [],
    supportThreads: row.support_threads ?? [],
    profiles: row.profiles ?? {},
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
  } satisfies RemoteAppState;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!hasCloudStateConfig()) {
    return NextResponse.json({
      cloudEnabled: false,
      state: createEmptyRemoteState(),
    });
  }

  try {
    const state = await fetchRemoteState();
    return NextResponse.json({ cloudEnabled: true, state });
  } catch (error) {
    return NextResponse.json(
      {
        cloudEnabled: true,
        error: error instanceof Error ? error.message : "Error al leer la nube.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!hasCloudStateConfig()) {
    return NextResponse.json({
      cloudEnabled: false,
      state: createEmptyRemoteState(),
    });
  }

  const incoming = (await request.json()) as Partial<RemoteAppState>;
  const currentState = await fetchRemoteState();

  const nextState = {
    tenant: CLOUD_TENANT,
    members: incoming.members ?? currentState.members,
    news: incoming.news ?? currentState.news,
    courses: incoming.courses ?? currentState.courses,
    course_content: incoming.courseContent ?? currentState.courseContent,
    connections: incoming.connections ?? currentState.connections,
    vacancies: incoming.vacancies ?? currentState.vacancies,
    candidates: incoming.candidates ?? currentState.candidates,
    support_threads: incoming.supportThreads ?? currentState.supportThreads,
    profiles: incoming.profiles ?? currentState.profiles,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(`${getSupabaseRestUrl("app_state?on_conflict=tenant")}`, {
    method: "POST",
    headers: {
      ...getSupabaseServiceHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(nextState),
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      { error: "No se pudo guardar en la nube.", details: body },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
