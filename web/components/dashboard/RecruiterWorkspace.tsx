"use client";

import { useMemo, useState } from "react";
import { candidates, vacancies } from "@/lib/demo-data";

const recruiterViews = [
  { id: "pipeline", label: "Pipeline" },
  { id: "automation", label: "Automatizacion" },
  { id: "messaging", label: "Mensajes" },
] as const;

type RecruiterView = (typeof recruiterViews)[number]["id"];

const vacancyFilters = ["Todas", ...vacancies.map((vacancy) => vacancy.title)];

export function RecruiterWorkspace() {
  const [activeView, setActiveView] = useState<RecruiterView>("pipeline");
  const [selectedFilter, setSelectedFilter] = useState("Todas");
  const [selectedCandidate, setSelectedCandidate] = useState(0);

  const visibleCandidates = useMemo(() => {
    if (selectedFilter === "Todas") {
      return candidates;
    }

    return candidates.filter((candidate) =>
      selectedFilter.toLowerCase().includes(candidate.role.split(" ")[0].toLowerCase()) ||
      candidate.role.toLowerCase().includes(selectedFilter.toLowerCase()),
    );
  }, [selectedFilter]);

  const currentCandidate = visibleCandidates[selectedCandidate] ?? visibleCandidates[0];

  return (
    <section className="admin-workspace">
      <div className="admin-toolbar">
        <div className="member-tab-row">
          {recruiterViews.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`member-tab admin-tab ${activeView === view.id ? "active" : ""}`}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="admin-filter-row">
          {vacancyFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`admin-filter-chip ${selectedFilter === filter ? "active" : ""}`}
              onClick={() => {
                setSelectedFilter(filter);
                setSelectedCandidate(0);
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {activeView === "pipeline" ? (
        <div className="admin-board-grid">
          <article className="admin-panel">
            <p className="role-section-label">Embudo visual</p>
            <h2>Etapas por candidato</h2>
            <div className="stack-sm">
              {visibleCandidates.map((candidate, index) => (
                <button
                  key={candidate.name}
                  type="button"
                  className={`admin-candidate-row ${selectedCandidate === index ? "active" : ""}`}
                  onClick={() => setSelectedCandidate(index)}
                >
                  <div>
                    <strong>{candidate.name}</strong>
                    <p>{candidate.role}</p>
                  </div>
                  <div className="tag-row">
                    <span className="pill">{candidate.stage}</span>
                    <span className="pill subtle">IA {candidate.score}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="admin-panel">
            <p className="role-section-label">Ficha central</p>
            <h2>Seguimiento detallado</h2>
            {currentCandidate ? (
              <div className="stack-sm">
                <div className="role-mini-card">
                  <strong>{currentCandidate.name}</strong>
                  <p>{currentCandidate.role}</p>
                  <span>{currentCandidate.stage}</span>
                </div>
                <div className="role-mini-card">
                  <strong>Observaciones</strong>
                  <p>{currentCandidate.notes}</p>
                  <span>{currentCandidate.tags.join(" · ")}</span>
                </div>
                <div className="admin-stage-track">
                  {["Nuevo", "Filtro IA", "Entrevista", "Descartado"].map((stage) => (
                    <div
                      key={stage}
                      className={`admin-stage-stop ${currentCandidate.stage === stage ? "active" : ""}`}
                    >
                      {stage}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="section-copy">No hay candidatos en esta vista.</p>
            )}
          </article>
        </div>
      ) : null}

      {activeView === "automation" ? (
        <div className="admin-board-grid">
          <article className="admin-panel">
            <p className="role-section-label">Flujos automáticos</p>
            <h2>Secuencias activas</h2>
            <div className="stack-sm">
              {[
                "Mensaje de recepcion al recibir CV",
                "Evaluacion IA al cargar expediente",
                "Recordatorio de entrevista por WhatsApp",
                "Cambio automatico a descarte por inasistencia",
              ].map((item) => (
                <div key={item} className="role-mini-card">
                  <strong>{item}</strong>
                  <p>Flujo activo dentro del embudo de reclutamiento.</p>
                  <span>Activo</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel">
            <p className="role-section-label">Acciones sugeridas</p>
            <h2>IA operativa</h2>
            <div className="stack-sm">
              {[
                "Priorizar perfiles con disponibilidad inmediata",
                "Revisar etiquetas de candidatos con score medio",
                "Escalar a reclutador senior los perfiles de entrevista",
              ].map((item) => (
                <div key={item} className="role-mini-card">
                  <strong>{item}</strong>
                  <p>Recomendacion generada segun avance y comportamiento del pipeline.</p>
                  <span>IA</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {activeView === "messaging" ? (
        <div className="admin-board-grid">
          <article className="admin-panel">
            <p className="role-section-label">Centro de mensajes</p>
            <h2>Conversaciones entrantes</h2>
            <div className="stack-sm">
              {[
                "NOV-2401 pregunta por acceso a taller",
                "USR-7788 solicita contacto con administrador",
                "Candidato nuevo quiere reprogramar entrevista",
              ].map((item) => (
                <div key={item} className="chat-bubble bot full-width">
                  <span>Inbox</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel">
            <p className="role-section-label">Bot previo</p>
            <h2>Respuestas sugeridas</h2>
            <div className="stack-sm">
              {[
                "Comparte clave de acceso y grupo correcto.",
                "Confirma etapa actual antes de escalar al administrador.",
                "Registra motivo de reprogramacion y actualiza entrevista.",
              ].map((item) => (
                <div key={item} className="role-mini-card">
                  <strong>Respuesta sugerida</strong>
                  <p>{item}</p>
                  <span>Bot + humano</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
