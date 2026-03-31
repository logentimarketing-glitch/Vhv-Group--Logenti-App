import { PortalCandidate } from "@/lib/portal-seeds";

export const PIPELINE_STAGES: PortalCandidate["stage"][] = [
  "Nuevo",
  "Filtro IA",
  "Entrevista",
  "Aprobado",
  "Contratado",
  "Descartado",
];

export function normalizeCandidates(items: PortalCandidate[]) {
  return items.map((candidate) => ({
    ...candidate,
    createdAt: candidate.createdAt ?? new Date().toISOString(),
    score: candidate.score ?? Math.min(97, Math.max(52, 68 + candidate.stage.length * 3)),
    company: candidate.company ?? (candidate.role.toLowerCase().includes("oui") ? "OUI" : "VHV Group"),
    tags: candidate.tags ?? [candidate.source, candidate.stage],
    history:
      candidate.history?.length
        ? candidate.history
        : [
            {
              id: `seed-${candidate.id}`,
              label: "Creado",
              detail: `Perfil registrado desde ${candidate.source}.`,
              createdAt: candidate.createdAt ?? new Date().toISOString(),
            },
          ],
  }));
}

export function stageAccent(stage: PortalCandidate["stage"]) {
  switch (stage) {
    case "Nuevo":
      return "lead";
    case "Filtro IA":
      return "contacted";
    case "Entrevista":
      return "process";
    case "Aprobado":
    case "Contratado":
      return "hired";
    case "Descartado":
      return "rejected";
    default:
      return "lead";
  }
}

export function movePipelineCandidate(candidate: PortalCandidate, nextStage: PortalCandidate["stage"]) {
  if (candidate.stage === nextStage) return candidate;

  return {
    ...candidate,
    stage: nextStage,
    tags: Array.from(new Set([...(candidate.tags ?? []), nextStage])),
    aiDecisionReason:
      nextStage === "Descartado"
        ? candidate.aiDecisionReason ||
          `IA sugiere descarte por baja coincidencia con ${candidate.role} y falta de señales suficientes para continuar el proceso.`
        : candidate.aiDecisionReason,
    history: [
      {
        id: crypto.randomUUID(),
        label: `Cambio a ${nextStage}`,
        detail: `El candidato se movio a la etapa ${nextStage}.`,
        createdAt: new Date().toISOString(),
      },
      ...(candidate.history ?? []),
    ],
  };
}

export function assignPipelineRecruiter(
  candidate: PortalCandidate,
  recruiter?: { matricula: string; name: string },
) {
  return {
    ...candidate,
    recruiterMatricula: recruiter?.matricula,
    recruiterName: recruiter?.name,
    history: [
      {
        id: crypto.randomUUID(),
        label: recruiter ? "Recruiter asignado" : "Recruiter removido",
        detail: recruiter
          ? `${recruiter.name} quedo a cargo del seguimiento.`
          : "Se elimino la asignacion del recruiter.",
        createdAt: new Date().toISOString(),
      },
      ...(candidate.history ?? []),
    ],
  };
}

export function updatePipelineNotes(candidate: PortalCandidate, notes: string) {
  return {
    ...candidate,
    notes,
    history: [
      {
        id: crypto.randomUUID(),
        label: "Notas actualizadas",
        detail: "Se editaron las observaciones del expediente.",
        createdAt: new Date().toISOString(),
      },
      ...(candidate.history ?? []),
    ],
  };
}
