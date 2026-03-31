"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PortalCandidate,
  PortalMember,
  PortalVacancy,
  STORAGE_KEYS,
  memberSeeds,
} from "@/lib/portal-seeds";
import { socialLinks } from "@/lib/social-links";
import { getAdminPermissions } from "@/lib/admin-permissions";
import { readStorage, writeStorage } from "@/lib/storage";
import { normalizeCandidates } from "@/lib/pipeline";
import { isProtectedAdministrativeUser } from "@/lib/mock-auth";
import { readMemberDirectory } from "@/lib/personal-search";
import { UserStatus } from "@/lib/user-status";

type AdminPortalProps = {
  user: {
    matricula: string;
    name: string;
    position: string;
    isMaster?: boolean;
  };
};

export function AdminPortal({ user }: AdminPortalProps) {
  const permissions = useMemo(
    () =>
      getAdminPermissions({
        role: "administrador",
        position: user.position,
        isMaster: user.isMaster,
      }),
    [user.isMaster, user.position],
  );

  const [vacancies, setVacancies] = useState<PortalVacancy[]>([]);
  const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
  const [members, setMembers] = useState<PortalMember[]>([]);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [candidateSource, setCandidateSource] = useState<string>(socialLinks[0].name);
  const [metaStatus, setMetaStatus] = useState("");
  const [metaHealth, setMetaHealth] = useState<{
    ok: boolean;
    pageId: string;
    tokenSource: string;
    canReadPage: boolean;
    canReadPosts: boolean;
    commentCandidates: number;
    postsChecked: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setVacancies(readStorage<PortalVacancy[]>(STORAGE_KEYS.vacancies, []));
  }, []);

  useEffect(() => {
    setCandidates(normalizeCandidates(readStorage<PortalCandidate[]>(STORAGE_KEYS.candidates, [])));

    const storedMembers = readMemberDirectory();
    if (storedMembers.length) {
      setMembers(storedMembers);
      return;
    }

    writeStorage(STORAGE_KEYS.members, memberSeeds);
    setMembers(memberSeeds);
  }, []);

  function saveVacancies(next: PortalVacancy[]) {
    setVacancies(next);
    writeStorage(STORAGE_KEYS.vacancies, next);
  }

  function saveCandidates(next: PortalCandidate[]) {
    const normalized = normalizeCandidates(next);
    setCandidates(normalized);
    writeStorage(STORAGE_KEYS.candidates, normalized);
  }

  function saveMembers(next: PortalMember[]) {
    setMembers(next);
    writeStorage(STORAGE_KEYS.members, next);
  }

  function createVacancy() {
    if (!permissions.canManageVacancies || !title.trim() || !area.trim()) return;

    const nextVacancy: PortalVacancy = {
      id: crypto.randomUUID(),
      title: title.trim(),
      area: area.trim(),
      status: "Nueva",
    };

    saveVacancies([nextVacancy, ...vacancies]);
    setTitle("");
    setArea("");
  }

  function createCandidate() {
    if (!permissions.canManageCandidates || !candidateName.trim() || !candidateRole.trim()) return;

    const nextCandidate: PortalCandidate = {
      id: crypto.randomUUID(),
      name: candidateName.trim(),
      role: candidateRole.trim(),
      source: candidateSource,
      notes: candidateNotes.trim(),
      aiDecisionReason: "",
      createdAt: new Date().toISOString(),
      stage: "Nuevo",
    };

    saveCandidates([nextCandidate, ...candidates]);
    setCandidateName("");
    setCandidateRole("");
    setCandidateNotes("");
  }

  function moveCandidate(id: string, stage: PortalCandidate["stage"]) {
    if (!permissions.canManageCandidates) return;

    saveCandidates(
      candidates.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              stage,
              aiDecisionReason:
                stage === "Descartado"
                  ? `IA sugiere descarte por baja coincidencia con ${candidate.role}, falta de avance o informacion insuficiente en el expediente.`
                  : candidate.aiDecisionReason,
            }
          : candidate,
      ),
    );
  }

  async function checkMetaConnection() {
    if (!permissions.canSyncMetaLeads) return;
    setMetaStatus("Validando conexion con Meta...");

    try {
      const response = await fetch("/api/meta/status", { cache: "no-store" });
      const data = await response.json();
      setMetaHealth(data);

      if (data.ok) {
        setMetaStatus(
          `Conexion activa con ${data.pageId}. Posts revisados: ${data.postsChecked}. Comentarios con perfil de candidato: ${data.commentCandidates}.`,
        );
        return;
      }

      setMetaStatus(data.error ?? "La conexion con Meta sigue incompleta.");
    } catch {
      setMetaStatus("No pude validar la conexion con Meta desde la app.");
    }
  }

  async function importMetaCandidates() {
    if (!permissions.canSyncMetaLeads) return;
    setMetaStatus("Conectando con Facebook...");

    try {
      const response = await fetch("/api/meta/candidates", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMetaStatus(data.error ?? "No se pudieron importar candidatos desde Facebook.");
        return;
      }

      const imported = (data.candidates as PortalCandidate[]).filter(
        (incoming) =>
          !candidates.some(
            (candidate) =>
              (candidate.externalId && incoming.externalId && candidate.externalId === incoming.externalId) ||
              (candidate.name === incoming.name && candidate.source === incoming.source),
          ),
      );

      if (!imported.length) {
        setMetaStatus("No hubo leads nuevos para importar.");
        return;
      }

      const next = [
        ...imported.map((candidate) => ({ ...candidate, id: crypto.randomUUID() })),
        ...candidates,
      ];
      saveCandidates(next);
      void checkMetaConnection();
      setMetaStatus(
        `Se importaron ${imported.length} candidatos desde Facebook. Comentarios: ${data.sources?.comments ?? 0}. Leads: ${data.sources?.leads ?? 0}.`,
      );
    } catch {
      setMetaStatus("La conexion con Facebook fallo. Revisa el token o los formularios.");
    }
  }

  function updateMemberRole(matricula: string, role: PortalMember["role"]) {
    if (!permissions.canManagePeopleLevels) return;
    if (role === "administrador" && !permissions.canPromoteAdministrators) return;
    if (isProtectedAdministrativeUser(matricula)) return;

    const nextStatus: UserStatus =
      role === "novato" ? "TRAINEE" : role === "usuario" ? "ACTIVE_EMPLOYEE" : "ADMIN";

    saveMembers(
      members.map((member) =>
        member.matricula === matricula ? { ...member, role, status: nextStatus } : member,
      ),
    );
  }

  const visibleRoleOptions = permissions.canPromoteAdministrators
    ? (["novato", "usuario", "administrador"] as const)
    : (["novato", "usuario"] as const);

  const manageableMembers = useMemo(
    () => members.filter((member) => member.role !== "administrador" && !isProtectedAdministrativeUser(member.matricula)),
    [members],
  );

  const recruiterMetrics = useMemo(() => {
    const totalLeads = candidates.length;
    const activeCandidates = candidates.filter(
      (candidate) => !["Contratado", "Descartado"].includes(candidate.stage),
    ).length;
    const hiredCount = candidates.filter((candidate) => candidate.stage === "Contratado").length;
    const conversions = totalLeads ? Math.round((hiredCount / totalLeads) * 100) : 0;

    return {
      totalLeads,
      activeCandidates,
      hiredCount,
      conversions,
    };
  }, [candidates]);

  const incomingLeads = useMemo(() => {
    const sourcePriority = ["WhatsApp", "Facebook Leads", "Facebook Comentarios", "Meta Ads", "Instagram", "TikTok"];

    return [...candidates]
      .sort((left, right) => {
        const leftDate = new Date(left.createdAt ?? 0).getTime();
        const rightDate = new Date(right.createdAt ?? 0).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 8)
      .map((candidate) => ({
        ...candidate,
        sourceLabel: sourcePriority.find((item) => candidate.source.toLowerCase().includes(item.toLowerCase())) ?? candidate.source,
      }));
  }, [candidates]);

  const capabilityCards = [
    permissions.canManageCandidates && {
      title: "Leads totales",
      value: String(recruiterMetrics.totalLeads),
      copy: "Todos los registros entrantes desde anuncios, redes o captura directa.",
    },
    permissions.canManageCandidates && {
      title: "Candidatos activos",
      value: String(recruiterMetrics.activeCandidates),
      copy: "Perfiles en seguimiento hasta contratacion o descarte.",
    },
    permissions.canManageCandidates && {
      title: "Conversion",
      value: `${recruiterMetrics.conversions}%`,
      copy: `${recruiterMetrics.hiredCount} candidatos ya llegaron a contratado.`,
    },
    permissions.canManageVacancies && {
      title: "Vacantes",
      value: String(vacancies.length),
      copy: "Puedes abrir posiciones y estructurar la demanda operativa.",
    },
    permissions.canManageCandidates && {
      title: "Candidatos",
      value: String(candidates.length),
      copy: "Puedes registrar, mover y filtrar candidatos dentro del pipeline.",
    },
    {
      title: "Novedades",
      value: permissions.canManageNews ? "Activo" : "Lectura",
      copy: "Tu puesto puede publicar, revisar o seguir la comunicacion interna.",
    },
  ].filter(Boolean) as { title: string; value: string; copy: string }[];

  useEffect(() => {
    if (!permissions.canSyncMetaLeads) return;
    void checkMetaConnection();
  }, [permissions.canSyncMetaLeads]);

  return (
    <div className="stack-xl">
      <section className="admin-overview-grid">
        {capabilityCards.map((card) => (
          <article key={card.title} className="panel admin-panel admin-metric-card">
            <p className="role-section-label">{card.title}</p>
            <strong>{card.value}</strong>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="panel admin-panel admin-intro-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow admin-eyebrow">Vista adaptada a tu puesto</p>
            <h2>{user.position}</h2>
            <p className="section-copy admin-copy">
              Este panel ya no muestra las mismas funciones para todos. Tu espacio se ajusta al
              alcance de tu puesto dentro de VHV Group.
            </p>
          </div>
        </div>
      </section>

      {permissions.canManageCandidates ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="section-heading">
            <div>
              <p className="eyebrow admin-eyebrow">Leads entrantes</p>
              <h2>Bandeja de captacion por canal</h2>
              <p className="section-copy admin-copy">
                Aqui ves de un vistazo lo que llega desde WhatsApp, anuncios y redes para abrir su expediente en segundos.
              </p>
            </div>
          </div>

          <div className="admin-leads-grid">
            {incomingLeads.length ? (
              incomingLeads.map((candidate) => (
                <article key={candidate.id} className="admin-candidate-row active recruiter-lead-card">
                  <div>
                    <strong>{candidate.name}</strong>
                    <p>{candidate.role}</p>
                    <p>
                      {candidate.sourceLabel} · {candidate.stage}
                    </p>
                  </div>
                  <div className="hero-actions">
                    <span className="pill">{candidate.company ?? "Sin empresa"}</span>
                    <Link
                      href={`/pipeline?candidate=${encodeURIComponent(candidate.id)}`}
                      className="secondary-link action-button"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state admin-empty-state">
                <strong>Aun no entran leads recientes.</strong>
                <p>En cuanto lleguen candidatos por WhatsApp, ads o redes, apareceran aqui primero.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {permissions.canManageVacancies ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="section-heading">
            <div>
              <p className="eyebrow admin-eyebrow">Vacantes</p>
              <h2>Crear y organizar posiciones</h2>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Nombre de vacante</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Area</span>
              <input value={area} onChange={(event) => setArea(event.target.value)} />
            </label>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-link action-button" onClick={createVacancy}>
              Guardar vacante
            </button>
          </div>
          <div className="stack-sm">
            {vacancies.length ? (
              vacancies.map((vacancy) => (
                <div key={vacancy.id} className="admin-vacancy-card">
                  <strong>{vacancy.title}</strong>
                  <p>{vacancy.area}</p>
                  <span className="pill">{vacancy.status}</span>
                </div>
              ))
            ) : (
              <div className="empty-state admin-empty-state">
                <strong>No hay vacantes creadas todavia.</strong>
                <p>Cuando abras posiciones nuevas apareceran aqui con una distribucion mas limpia y clara.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {permissions.canManageCandidates ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="section-heading">
            <div>
              <p className="eyebrow admin-eyebrow">Captacion y candidatos</p>
              <h2>Gestion de interesados</h2>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} />
            </label>
            <label className="field">
              <span>Vacante o perfil</span>
              <input value={candidateRole} onChange={(event) => setCandidateRole(event.target.value)} />
            </label>
            <label className="field">
              <span>Origen</span>
              <select
                className="field-select"
                value={candidateSource}
                onChange={(event) => setCandidateSource(event.target.value)}
              >
                {socialLinks.map((link) => (
                  <option key={link.href} value={link.name}>
                    {link.name}
                  </option>
                ))}
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Contacto directo">Contacto directo</option>
              </select>
            </label>
            <label className="field">
              <span>Notas iniciales</span>
              <input value={candidateNotes} onChange={(event) => setCandidateNotes(event.target.value)} />
            </label>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-link action-button" onClick={createCandidate}>
              Guardar candidato
            </button>
            {permissions.canSyncMetaLeads ? (
              <>
                <button type="button" className="secondary-link action-button" onClick={importMetaCandidates}>
                  Sincronizar Facebook
                </button>
                <button type="button" className="secondary-link action-button" onClick={checkMetaConnection}>
                  Probar conexion Meta
                </button>
              </>
            ) : null}
            {metaStatus ? <span className="pill">{metaStatus}</span> : null}
          </div>
          {permissions.canSyncMetaLeads && metaHealth ? (
            <div className="empty-state admin-empty-state">
              <strong>
                {metaHealth.ok
                  ? "Meta ya quedo enlazado con la pagina."
                  : "Meta todavia necesita ajuste para leer contenido."}
              </strong>
              <p>
                Pagina: {metaHealth.pageId || "sin definir"} | token: {metaHealth.tokenSource} | posts
                visibles: {metaHealth.canReadPosts ? "si" : "no"} | candidatos detectados en comentarios:{" "}
                {metaHealth.commentCandidates}
              </p>
              {!metaHealth.ok && metaHealth.error ? <p>Detalle: {metaHealth.error}</p> : null}
            </div>
          ) : null}
          <div className="stack-sm">
            {candidates.length ? (
              candidates.map((candidate) => (
                <div key={candidate.id} className="admin-candidate-row active">
                  <div>
                    <strong>{candidate.name}</strong>
                    <p>{candidate.role} - {candidate.source}</p>
                    {candidate.notes ? <p>Notas: {candidate.notes}</p> : null}
                    {candidate.aiDecisionReason ? <p>IA: {candidate.aiDecisionReason}</p> : null}
                  </div>
                  <div className="hero-actions">
                    <Link
                      href={`/pipeline?candidate=${encodeURIComponent(candidate.id)}`}
                      className="secondary-link action-button"
                    >
                      Abrir perfil
                    </Link>
                    {(["Nuevo", "Filtro IA", "Entrevista", "Aprobado", "Contratado", "Descartado"] as const).map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        className="admin-filter-chip"
                        onClick={() => moveCandidate(candidate.id, stage)}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state admin-empty-state">
                <strong>No hay candidatos registrados.</strong>
                <p>Cuando captes interesados, los iras moviendo por cada etapa del embudo desde aqui.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {permissions.canSyncMetaLeads && !permissions.canManageCandidates ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="section-heading">
            <div>
              <p className="eyebrow admin-eyebrow">Canales</p>
              <h2>Captacion digital</h2>
            </div>
          </div>
          <div className="stack-sm">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="admin-candidate-row"
              >
                <div>
                  <strong>{link.name}</strong>
                  <p>{link.href}</p>
                </div>
                <span className="pill">Canal</span>
              </a>
            ))}
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-link action-button" onClick={importMetaCandidates}>
              Sincronizar candidatos de Facebook
            </button>
            <button type="button" className="secondary-link action-button" onClick={checkMetaConnection}>
              Probar conexion Meta
            </button>
            {metaStatus ? <span className="pill">{metaStatus}</span> : null}
          </div>
          {metaHealth ? (
            <div className="empty-state admin-empty-state">
              <strong>
                {metaHealth.ok
                  ? "Meta ya quedo enlazado con la pagina."
                  : "Meta todavia necesita ajuste para leer contenido."}
              </strong>
              <p>
                Pagina: {metaHealth.pageId || "sin definir"} | token: {metaHealth.tokenSource} | posts
                visibles: {metaHealth.canReadPosts ? "si" : "no"} | candidatos detectados en comentarios:{" "}
                {metaHealth.commentCandidates}
              </p>
              {!metaHealth.ok && metaHealth.error ? <p>Detalle: {metaHealth.error}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {permissions.canManagePeopleLevels ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="section-heading">
            <div>
              <p className="eyebrow admin-eyebrow">Niveles de usuarios</p>
              <h2>Gestion de novatos y usuarios</h2>
            </div>
          </div>
          <div className="empty-state admin-empty-state">
            <strong>Este panel solo gestiona trabajadores inferiores.</strong>
            <p>El personal administrativo no se modifica desde aqui. Solo puedes mover perfiles entre novato y usuario cuando pertenezcan al equipo operativo.</p>
          </div>
          {manageableMembers.length ? (
            <div className="stack-sm">
              {manageableMembers.map((member) => (
                <div key={member.matricula} className="admin-candidate-row active">
                  <div>
                    <strong>{member.name}</strong>
                    <p>{member.position}</p>
                  </div>
                  <div className="hero-actions">
                    {visibleRoleOptions.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`admin-filter-chip ${member.role === role ? "active" : ""}`}
                        onClick={() => updateMemberRole(member.matricula, role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state admin-empty-state">
              <strong>No hay perfiles operativos para ajustar.</strong>
              <p>Cuando existan novatos o usuarios del equipo operativo, apareceran aqui para seguimiento de nivel.</p>
            </div>
          )}
        </section>
      ) : null}

      {!permissions.canManageVacancies &&
      !permissions.canManageCandidates &&
      !permissions.canManagePeopleLevels ? (
        <section className="panel admin-panel admin-section-spacious">
          <div className="empty-state admin-empty-state">
            <strong>Tu puesto no usa un panel de control pesado.</strong>
            <p>Tu experiencia administrativa esta enfocada en comunicacion, contenidos y seguimiento general, sin tocar niveles sensibles del equipo.</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
