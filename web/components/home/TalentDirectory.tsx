"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { courseTemplates, PortalCourse, PortalMember, STORAGE_KEYS } from "@/lib/portal-seeds";
import {
  getMemberEligibleCourses,
  getMemberStatus,
  PERSONAL_COMPANIES,
  type PersonalStatus,
  readMemberDirectory,
} from "@/lib/personal-search";
import { readStorage, writeStorage } from "@/lib/storage";
import { canActiveEmployeeViewMember, getStatusLabel, getUserStatus, UserStatus } from "@/lib/user-status";

type TalentDirectoryProps = {
  viewer: {
    matricula: string;
    role: "administrador" | "novato" | "usuario";
    company?: string;
    status?: UserStatus;
  };
  adminMode?: boolean;
};

export function TalentDirectory({ viewer, adminMode = false }: TalentDirectoryProps) {
  const [members, setMembers] = useState<PortalMember[]>([]);
  const [courses, setCourses] = useState<PortalCourse[]>(courseTemplates);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState<PersonalStatus>("todos");
  const [courseFilter, setCourseFilter] = useState("todos");

  useEffect(() => {
    const merged = readMemberDirectory();
    setMembers(merged);
    writeStorage(STORAGE_KEYS.members, merged);
    setCourses(readStorage<PortalCourse[]>(STORAGE_KEYS.courses, courseTemplates));
  }, [viewer.matricula]);

  const viewerStatus = getUserStatus(viewer);
  const canSearch = viewerStatus !== "TRAINEE";
  const canViewDemoBots = viewerStatus === "ADMIN";

  const novatoVisible = (member: PortalMember) =>
    member.role === "administrador" &&
    /reclut|atraccion de talento|rrhh|desarrollo organizacional/i.test(member.position);

  const demoBots = useMemo(
    () => (canViewDemoBots ? members.filter((member) => member.isDemoBot) : []),
    [canViewDemoBots, members],
  );

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        if (member.isDemoBot) return false;

        const visibleForViewer =
          viewerStatus === "TRAINEE"
            ? novatoVisible(member)
            : viewerStatus === "ADMIN"
              ? true
              : canActiveEmployeeViewMember(viewer, member);

        if (!visibleForViewer) return false;
        if (companyFilter !== "todos" && member.company !== companyFilter) return false;

        const memberStatus = getMemberStatus(member);
        if (statusFilter !== "todos" && memberStatus !== statusFilter) return false;

        const eligibleCourses = getMemberEligibleCourses(member, courses);
        if (courseFilter !== "todos" && !eligibleCourses.some((course) => course.id === courseFilter)) return false;

        if (!search.trim()) return true;
        return member.name.toLowerCase().includes(search.toLowerCase());
      }),
    [companyFilter, courses, courseFilter, members, search, statusFilter, viewer.role],
  );

  const grouped = useMemo(
    () => {
      const allowedCompanies =
        viewerStatus === "ADMIN"
          ? PERSONAL_COMPANIES
          : PERSONAL_COMPANIES.filter(
              (company) => company === "VHV Group" || company === viewer.company,
            );

      return allowedCompanies
        .map((company) => ({
          company,
          profiles: filteredMembers.filter((member) => member.company === company),
        }))
        .filter((group) => group.profiles.length > 0 || viewerStatus === "TRAINEE");
    },
    [filteredMembers, viewer.company, viewerStatus],
  );

  const courseOptions = useMemo(() => {
    const seen = new Map<string, PortalCourse>();
    filteredMembers.forEach((member) => {
      getMemberEligibleCourses(member, courses).forEach((course) => {
        seen.set(course.id, course);
      });
    });
    return Array.from(seen.values());
  }, [courses, filteredMembers]);

  return (
    <div className="stack-lg">
      {canSearch ? (
        <section className={`panel ${adminMode ? "admin-panel" : ""}`}>
          <div className="directory-filter-grid">
            <label className="field search-field">
              <span>Buscar personas</span>
              <div className="search-input-wrap">
                <span className="search-icon">?</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Busca por nombre"
                />
              </div>
            </label>
            <label className="field">
              <span>Empresa</span>
              <select className="field-select" value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
                <option value="todos">Todas</option>
                {PERSONAL_COMPANIES.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estatus</span>
              <select
                className="field-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PersonalStatus)}
              >
                <option value="todos">Todos</option>
                <option value="activo">Activo</option>
                <option value="en-capacitacion">En capacitacion</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </label>
            <label className="field">
              <span>Cursos</span>
              <select className="field-select" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                <option value="todos">Todos</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {canSearch ? (
        <section className={`panel ${adminMode ? "admin-panel" : ""}`}>
          <div className="section-heading">
            <div>
              <p className={`eyebrow ${adminMode ? "admin-eyebrow" : ""}`}>Resultados</p>
              <h2>Busqueda global</h2>
            </div>
          </div>

          {filteredMembers.length ? (
            <div className="card-grid card-grid-3">
              {filteredMembers.map((profile) => (
                <Link
                  key={`result-${profile.matricula}`}
                  href={`/profiles/${profile.matricula}`}
                  className={adminMode ? "admin-candidate-row" : "role-mini-card"}
                >
                  <div>
                    {getUserStatus(profile) === "ADMIN" ? (
                      <span className="admin-badge directory-badge">ADMIN STAFF</span>
                    ) : (
                      <span
                        className={`status-pill directory-badge ${
                          getUserStatus(profile) === "ACTIVE_EMPLOYEE"
                            ? "status-pill-active"
                            : "status-pill-trainee"
                        }`}
                      >
                        {getStatusLabel(getUserStatus(profile))}
                      </span>
                    )}
                    <strong>{profile.name}</strong>
                    <p>{profile.position}</p>
                    {profile.company ? <p>{profile.company}</p> : null}
                  </div>
                  <span className="pill subtle">{getMemberStatus(profile)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No encontré perfiles con esos filtros.</strong>
              <p>Ajusta nombre, empresa, estatus o curso para ampliar la busqueda.</p>
            </div>
          )}
        </section>
      ) : null}

      {grouped.map((group) => (
        <section key={group.company} className={`panel ${adminMode ? "admin-panel" : ""}`}>
          <div className="section-heading">
            <div>
              <p className={`eyebrow ${adminMode ? "admin-eyebrow" : ""}`}>Empresa</p>
              <h2>{group.company}</h2>
            </div>
          </div>

          {group.profiles.length ? (
            <div className="card-grid card-grid-3">
              {group.profiles.map((profile) => (
                <Link
                  key={profile.matricula}
                  href={`/profiles/${profile.matricula}`}
                  className={adminMode ? "admin-candidate-row" : "role-mini-card"}
                >
                  <div>
                    {getUserStatus(profile) === "ADMIN" ? (
                      <span className="admin-badge directory-badge">ADMIN STAFF</span>
                    ) : (
                      <span
                        className={`status-pill directory-badge ${
                          getUserStatus(profile) === "ACTIVE_EMPLOYEE"
                            ? "status-pill-active"
                            : "status-pill-trainee"
                        }`}
                      >
                        {getStatusLabel(getUserStatus(profile))}
                      </span>
                    )}
                    <strong>{profile.name}</strong>
                    <p>{profile.position}</p>
                    {profile.company ? <p>{profile.company}</p> : null}
                  </div>
                  <span className="pill subtle">{profile.role}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Aun no hay perfiles cargados para {group.company}.</strong>
              <p>
                {viewerStatus === "TRAINEE"
                  ? "Cuando existan reclutadores visibles para esta empresa apareceran aqui."
                  : "Cuando existan usuarios o novatos en esta empresa apareceran aqui."}
              </p>
            </div>
          )}
        </section>
      ))}

      {canViewDemoBots ? (
        <section className={`panel ${adminMode ? "admin-panel" : ""}`}>
          <div className="section-heading">
            <div>
              <p className={`eyebrow ${adminMode ? "admin-eyebrow" : ""}`}>Apartado interno</p>
              <h2>Demo bots</h2>
            </div>
          </div>

          {demoBots.length ? (
            <div className="card-grid card-grid-3">
              {demoBots.map((profile) => (
                <Link
                  key={`bot-${profile.matricula}`}
                  href={`/profiles/${profile.matricula}`}
                  className={adminMode ? "admin-candidate-row" : "role-mini-card"}
                >
                  <div>
                    <span className="pill warning directory-badge">BOT</span>
                    <strong>{profile.name}</strong>
                    <p>{profile.position}</p>
                  </div>
                  <span className="pill subtle">{getStatusLabel(getUserStatus(profile))}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No hay bots demo cargados.</strong>
              <p>Cuando exista un perfil bot interno para pruebas lo veras aqui.</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
