"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdminPermissions } from "@/lib/admin-permissions";
import { isUserEligibleForCourse } from "@/lib/course-eligibility";
import { canUserSeeCourse, getProgressForUser } from "@/lib/lms-progress";
import { migrateLmsStorageIfNeeded } from "@/lib/lms-storage";
import { normalizeMediaUrl } from "@/lib/media-links";
import {
  courseTemplates,
  memberSeeds,
  PortalCourse,
  PortalCourseAssignment,
  PortalCourseContent,
  PortalCourseProgress,
  PortalMember,
  STORAGE_KEYS,
} from "@/lib/portal-seeds";

type LmsHubProps = {
  user: {
    matricula?: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
    company?: string;
    position?: string;
    isMaster?: boolean;
  };
};

export function LmsHub({ user }: LmsHubProps) {
  const permissions =
    user.role === "administrador"
      ? getAdminPermissions({
          role: "administrador",
          position: user.position ?? "",
          isMaster: user.isMaster,
        })
      : null;

  const [courses, setCourses] = useState<PortalCourse[]>([]);
  const [members, setMembers] = useState<PortalMember[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, PortalCourseContent[]>>({});
  const [assignmentMap, setAssignmentMap] = useState<Record<string, PortalCourseAssignment[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, PortalCourseProgress[]>>({});
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [courseRole, setCourseRole] = useState<PortalCourse["role"]>("novato");
  const [accessCode, setAccessCode] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [itemType, setItemType] = useState<PortalCourseContent["type"]>("texto");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");
  const [editingContentId, setEditingContentId] = useState("");

  const mergedMembers = useMemo(() => {
    const byMatricula = new Map<string, PortalMember>();

    for (const seed of memberSeeds) {
      byMatricula.set(seed.matricula, seed);
    }

    for (const member of members) {
      byMatricula.set(member.matricula, {
        ...byMatricula.get(member.matricula),
        ...member,
      });
    }

    return Array.from(byMatricula.values());
  }, [members]);

  useEffect(() => {
    const migrated = migrateLmsStorageIfNeeded();
    setCourses(migrated.courses);
    setContentMap(migrated.contentMap);
    setAssignmentMap(migrated.assignmentMap);
    setProgressMap(migrated.progressMap);

    try {
      const parsedMembers = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.members) ?? JSON.stringify(memberSeeds),
      ) as PortalMember[];
      setMembers(Array.isArray(parsedMembers) ? parsedMembers : memberSeeds);
    } catch {
      setMembers(memberSeeds);
    }
  }, []);

  function saveCourses(next: PortalCourse[]) {
    setCourses(next);
    window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(next));
  }

  function saveContent(next: Record<string, PortalCourseContent[]>) {
    setContentMap(next);
    window.localStorage.setItem(STORAGE_KEYS.courseContent, JSON.stringify(next));
  }

  function saveAssignments(next: Record<string, PortalCourseAssignment[]>) {
    setAssignmentMap(next);
    window.localStorage.setItem(STORAGE_KEYS.courseAssignments, JSON.stringify(next));
  }

  function createCourse() {
    if (!permissions?.canManageCourses) return;
    if (!title.trim() || !accessCode.trim()) return;

    const nextCourse: PortalCourse = {
      id: crypto.randomUUID(),
      title: title.trim(),
      role: courseRole,
      accessCode: accessCode.trim(),
      summary:
        summary.trim() || "Curso creado por administracion. El contenido puede cargarse por enlace y seguimiento.",
      managedBy: "admin",
      kind: "curso",
      visibleInBot: true,
      allowedStatuses:
        courseRole === "administrador"
          ? ["ADMIN"]
          : courseRole === "novato"
            ? ["TRAINEE"]
            : ["ACTIVE_EMPLOYEE"],
    };

    saveCourses([nextCourse, ...courses]);
    setTitle("");
    setSummary("");
    setAccessCode("");
    setCourseRole("novato");
  }

  const manageableCourses = useMemo(
    () => courses.filter((course) => user.role === "administrador" && course.managedBy === "admin"),
    [courses, user.role],
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const assignableMembers = useMemo(() => {
    return mergedMembers.filter((member) => !member.isDemoBot && member.role !== "administrador");
  }, [mergedMembers]);

  function publishToCourse() {
    if (!permissions?.canManageCourses || !selectedCourseId || !itemTitle.trim()) return;

    const nextItem: PortalCourseContent = {
      id: editingContentId || crypto.randomUUID(),
      courseId: selectedCourseId,
      type: itemType,
      title: itemTitle.trim(),
      description: itemDescription.trim(),
      resourceUrl: normalizeMediaUrl(resourceUrl),
      dueDate: itemType === "asignacion" && dueDate.trim() ? dueDate : undefined,
      createdAt:
        (contentMap[selectedCourseId] ?? []).find((item) => item.id === editingContentId)?.createdAt ??
        new Date().toISOString(),
    };

    saveContent({
      ...contentMap,
      [selectedCourseId]: [
        nextItem,
        ...(contentMap[selectedCourseId] ?? []).filter((item) => item.id !== nextItem.id),
      ],
    });

    setItemType("texto");
    setItemTitle("");
    setItemDescription("");
    setResourceUrl("");
    setDueDate("");
    setEditingContentId("");
  }

  function loadCourseForEdit() {
    if (!selectedCourse) return;
    setTitle(selectedCourse.title);
    setSummary(selectedCourse.summary);
    setAccessCode(selectedCourse.accessCode);
    setCourseRole(selectedCourse.role);
  }

  function updateCourse() {
    if (!permissions?.canManageCourses || !selectedCourse || !title.trim() || !accessCode.trim()) return;

    saveCourses(
      courses.map((course) =>
        course.id === selectedCourse.id
          ? {
              ...course,
              title: title.trim(),
              summary:
                summary.trim() || "Curso creado por administracion. El contenido puede cargarse por enlace y seguimiento.",
              role: courseRole,
              accessCode: accessCode.trim(),
              allowedStatuses:
                courseRole === "administrador"
                  ? ["ADMIN"]
                  : courseRole === "novato"
                    ? ["TRAINEE"]
                    : ["ACTIVE_EMPLOYEE"],
            }
          : course,
      ),
    );
  }

  function deleteCourse() {
    if (!permissions?.canManageCourses || !selectedCourse) return;

    const nextCourses = courses.filter((course) => course.id !== selectedCourse.id);
    const nextContentMap = { ...contentMap };
    const nextAssignmentMap = { ...assignmentMap };
    const nextProgressMap = { ...progressMap };

    delete nextContentMap[selectedCourse.id];
    delete nextAssignmentMap[selectedCourse.id];
    delete nextProgressMap[selectedCourse.id];

    saveCourses(nextCourses);
    saveContent(nextContentMap);
    saveAssignments(nextAssignmentMap);
    setProgressMap(nextProgressMap);
    window.localStorage.setItem(STORAGE_KEYS.courseProgress, JSON.stringify(nextProgressMap));
    setSelectedCourseId("");
    setTitle("");
    setSummary("");
    setAccessCode("");
    setCourseRole("novato");
  }

  function editCourseContent(item: PortalCourseContent) {
    setEditingContentId(item.id);
    setItemType(item.type);
    setItemTitle(item.title);
    setItemDescription(item.description);
    setResourceUrl(item.resourceUrl);
    setDueDate(item.dueDate ?? "");
  }

  function deleteCourseContent(itemId: string) {
    if (!permissions?.canManageCourses || !selectedCourseId) return;

    saveContent({
      ...contentMap,
      [selectedCourseId]: (contentMap[selectedCourseId] ?? []).filter((item) => item.id !== itemId),
    });

    if (editingContentId === itemId) {
      setEditingContentId("");
      setItemType("texto");
      setItemTitle("");
      setItemDescription("");
      setResourceUrl("");
      setDueDate("");
    }
  }

  function assignUserToCourse() {
    if (!permissions?.canManageCourses || !selectedCourseId || !selectedAssignee) return;

    const member = mergedMembers.find((entry) => entry.matricula === selectedAssignee);
    if (!member) return;

    const currentAssignments = assignmentMap[selectedCourseId] ?? [];
    if (currentAssignments.some((assignment) => assignment.matricula === selectedAssignee)) return;

    const nextAssignment: PortalCourseAssignment = {
      id: crypto.randomUUID(),
      courseId: selectedCourseId,
      matricula: member.matricula,
      assignedByMatricula: user.matricula ?? "",
      assignedByName: user.position ?? "Administracion",
      assignedAt: new Date().toISOString(),
    };

    saveAssignments({
      ...assignmentMap,
      [selectedCourseId]: [nextAssignment, ...currentAssignments],
    });
    setSelectedAssignee("");
  }

  const visibleCourses = useMemo(() => {
    return courses.filter((course) =>
      canUserSeeCourse(
        course,
        user,
        isUserEligibleForCourse(
          {
            matricula: user.matricula ?? "",
            role: user.role,
            company: user.company,
            position: user.position,
          },
          course,
        ),
        assignmentMap[course.id] ?? [],
      ),
    );
  }, [assignmentMap, courses, user]);

  const lockedUserCourses = useMemo(
    () => (user.role === "novato" ? courses.filter((course) => course.role === "usuario") : []),
    [courses, user.role],
  );

  const currentUserProgress = useMemo(() => {
    return Object.fromEntries(
      visibleCourses.map((course) => [course.id, getProgressForUser(progressMap, course.id, user.matricula)]),
    ) as Record<string, PortalCourseProgress | null>;
  }, [progressMap, user.matricula, visibleCourses]);

  const totalProgress =
    user.role === "administrador" || !visibleCourses.length
      ? 0
      : Math.round(
          visibleCourses.reduce((sum, course) => sum + (currentUserProgress[course.id]?.progress ?? 0), 0) /
            visibleCourses.length,
        );

  const selectedCourseAssignments = selectedCourse ? assignmentMap[selectedCourse.id] ?? [] : [];
  const selectedCourseContent = selectedCourse ? contentMap[selectedCourse.id] ?? [] : [];
  const selectedCourseParticipants = selectedCourse
    ? selectedCourseAssignments
        .map((assignment) =>
          mergedMembers.find((member) => member.matricula === assignment.matricula),
        )
        .filter((member): member is PortalMember => Boolean(member))
    : [];

  const introCopy =
    user.role === "administrador"
      ? {
          eyebrow: "Capacitacion interna",
          title: "Cursos y grupos",
          copy:
            "Desde aqui el equipo administrativo crea cursos, asigna personas y sube contenido por enlace para cada grupo.",
        }
      : user.status === "TRAINEE"
        ? {
            eyebrow: "Mi espacio",
            title: "Tus cursos de onboarding",
            copy:
              "Aqui solo veras cursos de onboarding y espacios autorizados para tu cuenta durante tus primeros dias.",
          }
        : {
            eyebrow: "Mi espacio",
            title: "Tus cursos asignados",
            copy:
              "Aqui encontraras tus cursos activos, tu avance y los contenidos que ya te fueron habilitados.",
          };

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{introCopy.eyebrow}</p>
            <h2>{introCopy.title}</h2>
            <p className="section-copy">{introCopy.copy}</p>
          </div>
        </div>
          <div className="admin-overview-grid">
            <article className="panel admin-metric-card">
              <p className="role-section-label">
                {user.status === "TRAINEE" ? "Cursos habilitados" : "Cursos asignados"}
              </p>
              <strong>{visibleCourses.length}</strong>
              <p>
                {user.status === "TRAINEE"
                  ? "Estos son los cursos que ya puedes comenzar en tus primeros dias."
                  : "Estos son los cursos activos para tu cuenta."}
              </p>
            </article>
            <article className="panel admin-metric-card">
              <p className="role-section-label">
                {user.status === "TRAINEE" ? "Cursos bloqueados" : "Progreso global"}
              </p>
              <strong>{user.status === "TRAINEE" ? lockedUserCourses.length : `${totalProgress}%`}</strong>
              {user.status === "TRAINEE" ? (
                <p>Se activan cuando tu nivel cambie a usuario.</p>
              ) : (
                <div className="progress-bar" aria-hidden="true">
                  <span style={{ width: `${totalProgress}%` }} />
                </div>
              )}
            </article>
            <article className="panel admin-metric-card">
              <p className="role-section-label">Siguiente paso</p>
              <strong>
                {visibleCourses.length
                  ? user.status === "TRAINEE"
                    ? "Comienza tu induccion"
                    : "Continua tu ruta"
                  : "Sin cursos asignados"}
              </strong>
              <p>
                {visibleCourses.length
                  ? "Abre un curso para seguir con tu capacitacion."
                  : "Cuando administracion te asigne un curso, aparecera aqui."}
              </p>
            </article>
          </div>

          {user.status === "TRAINEE" && lockedMessage ? (
            <div className="empty-state">
              <strong>{lockedMessage}</strong>
              <p>Completa tu capacitacion actual para desbloquear herramientas de nivel usuario.</p>
            </div>
          ) : null}
      </section>

      {user.role === "administrador" && permissions?.canManageCourses ? (
        <div className="stack-lg">
          <div className="card-grid content-split">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Crear curso</p>
                  <h2>Nueva aula</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Titulo del curso</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label className="field">
                  <span>Resumen</span>
                  <input value={summary} onChange={(event) => setSummary(event.target.value)} />
                </label>
                <label className="field">
                  <span>Clave de acceso</span>
                  <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} />
                </label>
                <label className="field field-span-2">
                  <span>Rol objetivo</span>
                  <select
                    className="field-select"
                    value={courseRole}
                    onChange={(event) => setCourseRole(event.target.value as PortalCourse["role"])}
                  >
                    <option value="novato">Novato</option>
                    <option value="usuario">Usuario</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </label>
              </div>

              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={createCourse}>
                  Guardar curso
                </button>
                {selectedCourse ? (
                  <>
                    <button type="button" className="secondary-link action-button" onClick={loadCourseForEdit}>
                      Cargar datos del curso
                    </button>
                    <button type="button" className="secondary-link action-button" onClick={updateCourse}>
                      Actualizar curso
                    </button>
                    <button type="button" className="secondary-link action-button" onClick={deleteCourse}>
                      Borrar curso
                    </button>
                  </>
                ) : null}
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Asignar personas</p>
                  <h2>Relaciona cursos y participantes</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field field-span-2">
                  <span>Curso</span>
                  <select
                    className="field-select"
                    value={selectedCourseId}
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                  >
                    <option value="">Selecciona un curso</option>
                    {manageableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field-span-2">
                  <span>Persona</span>
                  <select
                    className="field-select"
                    value={selectedAssignee}
                    onChange={(event) => setSelectedAssignee(event.target.value)}
                  >
                    <option value="">Selecciona una persona</option>
                    {assignableMembers.map((member) => (
                      <option key={member.matricula} value={member.matricula}>
                        {member.name} - {member.position} ({member.status === "TRAINEE" ? "novato" : "usuario"})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={assignUserToCourse}>
                  Asignar al curso
                </button>
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gestion de contenido</p>
                <h2>Publicar dentro del curso</h2>
              </div>
            </div>

            <div className="form-grid">
              <label className="field field-span-2">
                <span>Curso</span>
                <select
                  className="field-select"
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                >
                  <option value="">Selecciona un curso</option>
                  {manageableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tipo</span>
                <select
                  className="field-select"
                  value={itemType}
                  onChange={(event) => setItemType(event.target.value as PortalCourseContent["type"])}
                >
                  <option value="texto">Texto</option>
                  <option value="codigo">Codigo</option>
                  <option value="foto">Foto</option>
                  <option value="video">Video</option>
                  <option value="blog">Blog</option>
                  <option value="archivo">Archivo</option>
                  <option value="asignacion">Asignacion</option>
                </select>
              </label>
              <label className="field">
                <span>Titulo</span>
                <input value={itemTitle} onChange={(event) => setItemTitle(event.target.value)} />
              </label>
              <label className="field field-span-2">
                <span>{itemType === "codigo" ? "Codigo del programa" : "Descripcion"}</span>
                <textarea
                  value={itemDescription}
                  onChange={(event) => setItemDescription(event.target.value)}
                  rows={itemType === "codigo" ? 10 : 4}
                  placeholder={
                    itemType === "codigo"
                      ? "Pega aqui el codigo que quieres compartir dentro del curso."
                      : undefined
                  }
                />
              </label>
              {itemType !== "codigo" ? (
                <label className="field field-span-2">
                  <span>Enlace del recurso</span>
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(event) => setResourceUrl(event.target.value)}
                    placeholder="https://drive.google.com/... o https://..."
                  />
                </label>
              ) : null}
              {itemType === "asignacion" ? (
                <label className="field">
                  <span>Fecha limite</span>
                  <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} placeholder="2026-03-30" />
                </label>
              ) : null}
            </div>

            <div className="hero-actions">
              <button type="button" className="primary-link action-button" onClick={publishToCourse}>
                {editingContentId ? "Guardar cambios" : "Publicar en el curso"}
              </button>
              {editingContentId ? (
                <button
                  type="button"
                  className="secondary-link action-button"
                  onClick={() => {
                    setEditingContentId("");
                    setItemType("texto");
                    setItemTitle("");
                    setItemDescription("");
                    setResourceUrl("");
                    setDueDate("");
                  }}
                >
                  Cancelar edicion
                </button>
              ) : null}
            </div>
          </section>

          {selectedCourse ? (
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Vista previa</p>
                  <h2>Asi se vera el curso para talento</h2>
                  <p className="section-copy">
                    Esta vista te deja revisar el contenido publicado y las personas asignadas sin salir del panel administrativo.
                  </p>
                </div>
              </div>

              <div className="admin-overview-grid">
                <article className="panel admin-metric-card">
                  <p className="role-section-label">Curso</p>
                  <strong>{selectedCourse.title}</strong>
                  <p>{selectedCourse.summary}</p>
                </article>
                <article className="panel admin-metric-card">
                  <p className="role-section-label">Personas asignadas</p>
                  <strong>{selectedCourseParticipants.length}</strong>
                  <p>Novatos y usuarios inscritos en este curso.</p>
                </article>
                <article className="panel admin-metric-card">
                  <p className="role-section-label">Contenidos</p>
                  <strong>{selectedCourseContent.length}</strong>
                  <p>Materiales y tareas visibles dentro del aula.</p>
                </article>
              </div>

              <div className="card-grid content-split">
                <section className="role-mini-card">
                  <strong>Participantes</strong>
                  <div className="stack-sm">
                    {selectedCourseParticipants.length ? (
                      selectedCourseParticipants.map((member) => (
                        <div key={member.matricula} className="role-mini-card">
                          <strong>{member.name}</strong>
                          <p>{member.position}</p>
                          <span>{member.status === "TRAINEE" ? "Novato" : "Usuario"}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <strong>No hay personas asignadas todavia.</strong>
                      </div>
                    )}
                  </div>
                </section>

                <section className="role-mini-card">
                  <strong>Vista del contenido</strong>
                  <div className="stack-sm">
                    {selectedCourseContent.length ? (
                      selectedCourseContent.map((item) => (
                        <article key={item.id} className="role-mini-card">
                          <strong>{item.title}</strong>
                          {item.type === "codigo" ? (
                            <pre className="course-code-block">
                              <code>{item.description || "// Sin codigo cargado."}</code>
                            </pre>
                          ) : (
                            <p>{item.description || "Sin descripcion adicional."}</p>
                          )}
                          <span>{item.type}</span>
                          {item.resourceUrl ? (
                            <a
                              href={item.resourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="secondary-link"
                            >
                              Abrir recurso
                            </a>
                          ) : null}
                          {item.dueDate ? <p>Entrega: {item.dueDate}</p> : null}
                          <div className="hero-actions">
                            <button
                              type="button"
                              className="secondary-link action-button"
                              onClick={() => editCourseContent(item)}
                            >
                              Editar contenido
                            </button>
                            <button
                              type="button"
                              className="secondary-link action-button"
                              onClick={() => deleteCourseContent(item.id)}
                            >
                              Borrar contenido
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="empty-state">
                        <strong>El curso aun no tiene contenido publicado.</strong>
                      </div>
                    )}
                  </div>

                  <div className="hero-actions">
                    <Link href={`/lms/${selectedCourse.id}`} className="primary-link action-button">
                      Abrir vista del curso
                    </Link>
                  </div>
                </section>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cursos</p>
            <h2>
              {user.status === "TRAINEE"
                ? "Cursos disponibles para tu nivel"
                : user.role === "administrador"
                  ? "Cursos disponibles"
                  : "Cursos asignados a tu perfil"}
            </h2>
          </div>
        </div>

        <div className="card-grid card-grid-3">
          {visibleCourses.map((course) => {
            const progress = currentUserProgress[course.id];
            const assignedCount = assignmentMap[course.id]?.length ?? 0;
            return (
              <Link key={course.id} href={`/lms/${course.id}`} className="role-mini-card lms-course-card-link">
                <strong>{course.title}</strong>
                <p>{course.summary}</p>
                <span>{course.role}</span>
                {user.role === "administrador" ? (
                  <p>{assignedCount} persona(s) asignadas</p>
                ) : (
                  <>
                    <p>Progreso: {progress?.progress ?? 0}%</p>
                    <div className="progress-bar" aria-hidden="true">
                      <span style={{ width: `${progress?.progress ?? 0}%` }} />
                    </div>
                  </>
                )}
                <div className="hero-actions">
                  <span className="secondary-link">Abrir curso</span>
                </div>
              </Link>
            );
          })}

          {user.role === "novato"
            ? lockedUserCourses.map((course) => (
                <button
                  key={`locked-${course.id}`}
                  type="button"
                  className="role-mini-card"
                  onClick={() => setLockedMessage("Nivel usuario fijo")}
                >
                  <strong>{course.title}</strong>
                  <p>{course.summary}</p>
                  <span>Curso bloqueado - nivel usuario</span>
                  <div className="hero-actions">
                    <span className="pill subtle">Candado</span>
                  </div>
                </button>
              ))
            : null}

          {!visibleCourses.length ? (
            <div className="empty-state">
              <strong>No hay cursos visibles por ahora.</strong>
              <p>Cuando se creen o asignen cursos para tu cuenta, apareceran aqui.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
