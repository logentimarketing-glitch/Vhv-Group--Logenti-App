"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalCandidate, STORAGE_KEYS, memberSeeds } from "@/lib/portal-seeds";
import {
  assignPipelineRecruiter,
  movePipelineCandidate,
  normalizeCandidates,
  PIPELINE_STAGES,
  stageAccent,
  updatePipelineNotes,
} from "@/lib/pipeline";
import { readStorage, writeStorage } from "@/lib/storage";

const recruiters = memberSeeds.filter((member) => member.role === "administrador");

type PipelineBoardProps = {
  initialCandidateId?: string;
};

export function PipelineBoard({ initialCandidateId }: PipelineBoardProps) {
  const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draggingId, setDraggingId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("todos");
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    const parsed = normalizeCandidates(readStorage<PortalCandidate[]>(STORAGE_KEYS.candidates, []));
    if (!parsed.length) return;
    setCandidates(parsed);
    const initialCandidate =
      parsed.find((candidate) => candidate.id === initialCandidateId) ??
      parsed[0];
    setSelectedId(initialCandidate?.id ?? "");
    setNotesDraft(initialCandidate?.notes ?? "");
  }, [initialCandidateId]);

  function saveCandidates(next: PortalCandidate[]) {
    setCandidates(next);
    writeStorage(STORAGE_KEYS.candidates, next);
  }

  const visibleCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (recruiterFilter !== "todos" && candidate.recruiterMatricula !== recruiterFilter) {
        return false;
      }

      if (!search.trim()) return true;

      return `${candidate.name} ${candidate.role} ${candidate.source} ${candidate.company ?? ""} ${candidate.recruiterName ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [candidates, recruiterFilter, search]);

  const selectedCandidate =
    visibleCandidates.find((candidate) => candidate.id === selectedId) ??
    candidates.find((candidate) => candidate.id === selectedId) ??
    visibleCandidates[0];

  useEffect(() => {
    if (!selectedCandidate) return;
    setSelectedId(selectedCandidate.id);
    setNotesDraft(selectedCandidate.notes ?? "");
  }, [selectedCandidate?.id]);

  const metrics = useMemo(
    () => ({
      total: visibleCandidates.length,
      active: visibleCandidates.filter((candidate) => !["Contratado", "Descartado"].includes(candidate.stage)).length,
      hired: visibleCandidates.filter((candidate) => candidate.stage === "Contratado").length,
      rejected: visibleCandidates.filter((candidate) => candidate.stage === "Descartado").length,
    }),
    [visibleCandidates],
  );

  function updateCandidate(id: string, updater: (candidate: PortalCandidate) => PortalCandidate) {
    const next = candidates.map((candidate) => (candidate.id === id ? updater(candidate) : candidate));
    saveCandidates(next);
  }

  function moveCandidate(id: string, nextStage: PortalCandidate["stage"]) {
    updateCandidate(id, (candidate) => movePipelineCandidate(candidate, nextStage));
  }

  function assignRecruiter(id: string, recruiterMatricula: string) {
    const recruiter = recruiters.find((item) => item.matricula === recruiterMatricula);
    updateCandidate(id, (candidate) => assignPipelineRecruiter(candidate, recruiter));
  }

  function saveNotes() {
    if (!selectedCandidate) return;
    updateCandidate(selectedCandidate.id, (candidate) => updatePipelineNotes(candidate, notesDraft));
  }

  function handleDrop(stage: PortalCandidate["stage"]) {
    if (!draggingId) return;
    moveCandidate(draggingId, stage);
    setDraggingId("");
  }

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Pipeline CRM</p>
          <h1>Embudo operativo de candidatos</h1>
          <p className="section-copy">
            Organiza leads, asigna recruiter, mueve etapas con arrastre y revisa el historial completo de cada perfil.
          </p>
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="panel admin-panel admin-metric-card">
          <p className="role-section-label">Total pipeline</p>
          <strong>{metrics.total}</strong>
          <p>Perfiles visibles con tus filtros activos.</p>
        </article>
        <article className="panel admin-panel admin-metric-card">
          <p className="role-section-label">Activos</p>
          <strong>{metrics.active}</strong>
          <p>Leads en seguimiento hasta aprobacion.</p>
        </article>
        <article className="panel admin-panel admin-metric-card">
          <p className="role-section-label">Contratados</p>
          <strong>{metrics.hired}</strong>
          <p>Talento ya consolidado en la etapa final.</p>
        </article>
        <article className="panel admin-panel admin-metric-card">
          <p className="role-section-label">Descartados</p>
          <strong>{metrics.rejected}</strong>
          <p>Perfiles cerrados con motivo visible.</p>
        </article>
      </section>

      <section className="panel admin-panel pipeline-toolbar">
        <label className="field search-field">
          <span>Buscar candidato</span>
          <div className="search-input-wrap">
            <span className="search-icon">?</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, vacante, empresa o recruiter"
            />
          </div>
        </label>

        <label className="field">
          <span>Filtrar recruiter</span>
          <select
            className="field-select"
            value={recruiterFilter}
            onChange={(event) => setRecruiterFilter(event.target.value)}
          >
            <option value="todos">Todos</option>
            {recruiters.map((recruiter) => (
              <option key={recruiter.matricula} value={recruiter.matricula}>
                {recruiter.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="pipeline-shell">
        <div className="pipeline-board">
          {PIPELINE_STAGES.map((stage) => {
            const stageItems = visibleCandidates.filter((candidate) => candidate.stage === stage);

            return (
              <article
                key={stage}
                className={`panel admin-panel pipeline-column ${stageAccent(stage)}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="pipeline-column-head">
                  <div>
                    <p className="role-section-label">{stage}</p>
                    <strong>{stageItems.length}</strong>
                  </div>
                  <span className="pill subtle">{stage}</span>
                </div>

                <div className="pipeline-column-body">
                  {stageItems.length ? (
                    stageItems.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        draggable
                        onDragStart={() => setDraggingId(candidate.id)}
                        onClick={() => {
                          setSelectedId(candidate.id);
                          setNotesDraft(candidate.notes ?? "");
                        }}
                        className={`pipeline-card ${selectedId === candidate.id ? "active" : ""}`}
                      >
                        <div className="candidate-head">
                          <strong>{candidate.name}</strong>
                          <span className="pill subtle">{candidate.score}</span>
                        </div>
                        <p>{candidate.role}</p>
                        <div className="pipeline-card-meta">
                          <span>{candidate.company ?? "Sin empresa"}</span>
                          <span>{candidate.source}</span>
                        </div>
                        <div className="tag-row">
                          {(candidate.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={`${candidate.id}-${tag}`} className="pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="pipeline-recruiter">
                          {candidate.recruiterName ? `Recruiter: ${candidate.recruiterName}` : "Sin recruiter asignado"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <strong>No hay candidatos aqui.</strong>
                      <p>Arrastra perfiles a esta etapa o crea nuevos desde control.</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="panel admin-panel pipeline-detail">
          {selectedCandidate ? (
            <div className="stack-md">
              <div className="section-heading">
                <div>
                  <p className="eyebrow admin-eyebrow">Ficha del candidato</p>
                  <h2>{selectedCandidate.name}</h2>
                  <p className="section-copy">
                    {selectedCandidate.role} · {selectedCandidate.company ?? "Sin empresa"} · {selectedCandidate.source}
                  </p>
                </div>
              </div>

              <div className="admin-overview-grid">
                <div className="role-mini-card">
                  <strong>Stage actual</strong>
                  <p>{selectedCandidate.stage}</p>
                </div>
                <div className="role-mini-card">
                  <strong>Scoring</strong>
                  <p>{selectedCandidate.score}</p>
                </div>
              </div>

              <label className="field">
                <span>Asignar recruiter</span>
                <select
                  className="field-select"
                  value={selectedCandidate.recruiterMatricula ?? ""}
                  onChange={(event) => assignRecruiter(selectedCandidate.id, event.target.value)}
                >
                  <option value="">Sin asignacion</option>
                  {recruiters.map((recruiter) => (
                    <option key={recruiter.matricula} value={recruiter.matricula}>
                      {recruiter.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="stack-sm">
                <span className="role-section-label">Mover etapa</span>
                <div className="tag-row">
                  {PIPELINE_STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      className={`admin-filter-chip ${selectedCandidate.stage === stage ? "active" : ""}`}
                      onClick={() => moveCandidate(selectedCandidate.id, stage)}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Notas</span>
                <textarea rows={5} value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} />
              </label>

              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={saveNotes}>
                  Guardar notas
                </button>
              </div>

              {selectedCandidate.aiDecisionReason ? (
                <div className="notes-box">
                  <strong>Motivo IA</strong>
                  <p>{selectedCandidate.aiDecisionReason}</p>
                </div>
              ) : null}

              <div className="stack-sm">
                <span className="role-section-label">Historial</span>
                {(selectedCandidate.history ?? []).length ? (
                  (selectedCandidate.history ?? []).map((entry) => (
                    <div key={entry.id} className="pipeline-history-item">
                      <strong>{entry.label}</strong>
                      <p>{entry.detail}</p>
                      <span>{new Date(entry.createdAt).toLocaleString("es-MX")}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>Aun no hay historial.</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>No hay candidato seleccionado.</strong>
              <p>Selecciona una tarjeta del tablero para abrir su ficha.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
