import { PortalCandidate } from "@/lib/portal-seeds";

type MetaField = {
  name: string;
  values?: string[];
};

type MetaLead = {
  id: string;
  created_time?: string;
  field_data?: MetaField[];
};

type MetaComment = {
  id: string;
  message?: string;
  created_time?: string;
  from?: {
    id?: string;
    name?: string;
  };
};

type MetaPost = {
  id: string;
  message?: string;
  created_time?: string;
  comments?: {
    data?: MetaComment[];
  };
};

export function inferRole(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("marketing")) return "Marketing";
  if (normalized.includes("reclut")) return "Reclutamiento";
  if (normalized.includes("ventas")) return "Ventas";
  if (normalized.includes("italika")) return "Italika";
  if (normalized.includes("oui")) return "OUI";
  if (normalized.includes("morsa")) return "Grupo Morsa";
  if (normalized.includes("elektra")) return "Elektra";
  return "Perfil general";
}

function getFieldValue(fields: MetaField[] | undefined, key: string) {
  const field = fields?.find((item) => item.name === key);
  return field?.values?.[0] ?? "";
}

function looksLikeCandidateMessage(message: string) {
  const normalized = message.toLowerCase();

  return [
    "me interesa",
    "informes",
    "informacion",
    "vacante",
    "empleo",
    "trabajo",
    "cv",
    "curriculum",
    "postular",
    "aplicar",
    "quiero entrar",
    "me gustaria",
    "disponible",
  ].some((term) => normalized.includes(term));
}

export async function resolveMetaPageAccessToken() {
  const pageId = process.env.META_PAGE_ID?.trim();
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  const userAccessToken = process.env.META_USER_ACCESS_TOKEN?.trim();

  if (!pageId) {
    throw new Error("Falta META_PAGE_ID.");
  }

  if (pageAccessToken) {
    return { pageId, accessToken: pageAccessToken };
  }

  if (!userAccessToken) {
    throw new Error("Falta META_PAGE_ACCESS_TOKEN o META_USER_ACCESS_TOKEN.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userAccessToken)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Meta respondio ${response.status} al pedir paginas del usuario.`);
  }

  const body = (await response.json()) as {
    data?: Array<{ id: string; name: string; access_token: string }>;
  };

  const page = body.data?.find((item) => item.id === pageId);

  if (!page?.access_token) {
    throw new Error("No pude derivar el token de pagina desde el token de usuario.");
  }

  return { pageId, accessToken: page.access_token };
}

export async function fetchMetaLeads() {
  const formIds = (process.env.META_LEAD_FORM_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!formIds.length) {
    return [] as PortalCandidate[];
  }

  const { accessToken } = await resolveMetaPageAccessToken();

  const leadGroups = await Promise.all(
    formIds.map(async (formId) => {
      const response = await fetch(
        `https://graph.facebook.com/v25.0/${formId}/leads?fields=id,created_time,field_data&limit=100&access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Meta respondio ${response.status} para el formulario ${formId}.`);
      }

      const body = (await response.json()) as { data?: MetaLead[] };
      return body.data ?? [];
    }),
  );

  const leads = leadGroups.flat();

  return leads.map((lead) => {
    const fullName =
      getFieldValue(lead.field_data, "full_name") ||
      [getFieldValue(lead.field_data, "first_name"), getFieldValue(lead.field_data, "last_name")]
        .filter(Boolean)
        .join(" ") ||
      "Lead sin nombre";
    const companyContext =
      getFieldValue(lead.field_data, "company_name") ||
      getFieldValue(lead.field_data, "job_title") ||
      getFieldValue(lead.field_data, "work_email");

    return {
      id: `lead-${lead.id}`,
      externalId: `lead:${lead.id}`,
      name: fullName,
      role: inferRole(companyContext),
      source: "Facebook Leads",
      notes: `Importado desde Meta el ${lead.created_time ?? "sin fecha"}${companyContext ? ` | contexto: ${companyContext}` : ""}`,
      aiDecisionReason: "",
      stage: "Nuevo" as const,
    };
  });
}

export async function fetchMetaCommentCandidates() {
  const { pageId, accessToken } = await resolveMetaPageAccessToken();

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${pageId}/posts?fields=id,message,created_time,comments.limit(50){id,message,created_time,from}&limit=25&access_token=${encodeURIComponent(accessToken)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Meta respondio ${response.status} al leer posts y comentarios.`);
  }

  const body = (await response.json()) as { data?: MetaPost[] };
  const posts = body.data ?? [];

  return posts
    .flatMap((post) =>
      (post.comments?.data ?? [])
        .filter((comment) => looksLikeCandidateMessage(comment.message ?? ""))
        .map((comment) => ({
          id: `comment-${comment.id}`,
          externalId: `comment:${comment.id}`,
          name: comment.from?.name || "Interesado sin nombre",
          role: inferRole(`${comment.message ?? ""} ${post.message ?? ""}`),
          source: "Facebook Comentarios",
          notes: `Detectado por comentario en post ${post.id}. Comentario: ${comment.message ?? "sin texto"}`,
          aiDecisionReason:
            "IA detecto intencion de candidatura en comentario publico de Facebook y lo agrego para revision.",
          stage: "Nuevo" as const,
        })),
    );
}

export function mergeCandidates(...groups: PortalCandidate[][]) {
  const seen = new Set<string>();
  const merged: PortalCandidate[] = [];

  for (const candidate of groups.flat()) {
    const key = candidate.externalId || `${candidate.name}:${candidate.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(candidate);
  }

  return merged;
}

export async function getMetaConnectionStatus() {
  const pageId = process.env.META_PAGE_ID?.trim() ?? "";
  const hasUserToken = Boolean(process.env.META_USER_ACCESS_TOKEN?.trim());
  const hasPageToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN?.trim());

  if (!pageId) {
    return {
      ok: false,
      pageId: "",
      tokenSource: "missing" as const,
      canReadPage: false,
      canReadPosts: false,
      commentCandidates: 0,
      postsChecked: 0,
      error: "Falta META_PAGE_ID.",
    };
  }

  try {
    const { accessToken } = await resolveMetaPageAccessToken();
    const tokenSource = hasPageToken ? ("page" as const) : ("derived-from-user" as const);

    const pageResponse = await fetch(
      `https://graph.facebook.com/v25.0/${pageId}?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" },
    );

    if (!pageResponse.ok) {
      throw new Error(`Meta respondio ${pageResponse.status} al validar la pagina.`);
    }

    const postsResponse = await fetch(
      `https://graph.facebook.com/v25.0/${pageId}/posts?fields=id,message,created_time,comments.limit(10){id,message,from,created_time}&limit=10&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" },
    );

    if (!postsResponse.ok) {
      throw new Error(`Meta respondio ${postsResponse.status} al validar posts y comentarios.`);
    }

    const postsBody = (await postsResponse.json()) as { data?: MetaPost[] };
    const posts = postsBody.data ?? [];
    const commentCandidates = posts
      .flatMap((post) => post.comments?.data ?? [])
      .filter((comment) => looksLikeCandidateMessage(comment.message ?? "")).length;

    return {
      ok: true,
      pageId,
      tokenSource,
      canReadPage: true,
      canReadPosts: true,
      commentCandidates,
      postsChecked: posts.length,
      hasUserToken,
      hasPageToken,
    };
  } catch (error) {
    return {
      ok: false,
      pageId,
      tokenSource: hasPageToken ? ("page" as const) : hasUserToken ? ("derived-from-user" as const) : ("missing" as const),
      canReadPage: false,
      canReadPosts: false,
      commentCandidates: 0,
      postsChecked: 0,
      hasUserToken,
      hasPageToken,
      error: error instanceof Error ? error.message : "No se pudo validar la conexion con Meta.",
    };
  }
}
