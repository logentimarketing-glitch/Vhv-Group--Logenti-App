"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isUserEligibleForCourse } from "@/lib/course-eligibility";
import {
  canUserSeeCourse,
  getProgressForUser,
  isUnlockedForCourse,
  unlockCourseForUser,
  upsertCourseProgress,
} from "@/lib/lms-progress";
import { migrateLmsStorageIfNeeded } from "@/lib/lms-storage";
import { isImageLikeUrl, isVideoLikeUrl, normalizeMediaUrl } from "@/lib/media-links";
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

type CourseAccessProps = {
  courseId: string;
  user: {
    matricula?: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
    company?: string;
    position?: string;
    isMaster?: boolean;
  };
};

export function CourseAccess({ courseId, user }: CourseAccessProps) {
  const [courses, setCourses] = useState<PortalCourse[]>(courseTemplates);
  const [members, setMembers] = useState<PortalMember[]>(memberSeeds);
  const [contentMap, setContentMap] = useState<Record<string, PortalCourseContent[]>>({});
  const [assignmentMap, setAssignmentMap] = useState<Record<string, PortalCourseAssignment[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, PortalCourseProgress[]>>({});
  const [unlockMap, setUnlockMap] = useState<Record<string, string[]>>({});
  const [code, setCode] = useState("");
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState("");
  const [itemType, setItemType] = useState<PortalCourseContent["type"]>("video");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adminPreviewMode, setAdminPreviewMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");

  useEffect(() => {
    try {
      const migrated = migrateLmsStorageIfNeeded();
      setCourses(migrated.courses);
      setContentMap(migrated.contentMap);
      setAssignmentMap(migrated.assignmentMap);
      setProgressMap(migrated.progressMap);
      setUnlockMap(migrated.unlockMap);
    } catch {}

    try {
      const parsedMembers = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.members) ?? JSON.stringify(memberSeeds),
      ) as PortalMember[];
      setMembers(Array.isArray(parsedMembers) ? parsedMembers : memberSeeds);
    } catch {}

  }, []);

  const course = useMemo(
    () => courses.find((item) => item.id === courseId),
    [courseId, courses],
  );

  const courseAssignments = assignmentMap[courseId] ?? [];
  const courseContent = contentMap[courseId] ?? [];
  const progress = getProgressForUser(progressMap, courseId, user.matricula);
  const checklistItems = courseContent.filter((item) => item.type !== "blog");
  const completedChecklist = progress?.checklistCompletedIds ?? [];

  function saveContent(nextMap: Record<string, PortalCourseContent[]>) {
    setContentMap(nextMap);
    window.localStorage.setItem(STORAGE_KEYS.courseContent, JSON.stringify(nextMap));
  }

  function saveProgress(nextMap: Record<string, PortalCourseProgress[]>) {
    setProgressMap(nextMap);
    window.localStorage.setItem(STORAGE_KEYS.courseProgress, JSON.stringify(nextMap));
  }

  function saveUnlocks(nextMap: Record<string, string[]>) {
    setUnlockMap(nextMap);
    window.localStorage.setItem(STORAGE_KEYS.courseUnlocks, JSON.stringify(nextMap));
  }

  function saveCourses(nextCourses: PortalCourse[]) {
    setCourses(nextCourses);
    window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(nextCourses));
  }

  if (!course) {
    return (
      <div className="panel">
        <div className="empty-state">
          <strong>Curso no encontrado.</strong>
          <p>Este aula aun no existe o fue eliminada.</p>
        </div>
      </div>
    );
  }

  const activeCourse = course;

  const eligible = isUserEligibleForCourse(
    {
      matricula: user.matricula ?? "",
      role: user.role,
      company: user.company,
      position: user.position,
    },
    activeCourse,
  );

  if (!canUserSeeCourse(activeCourse, user, eligible, courseAssignments)) {
    return (
      <div className="panel">
        <div className="empty-state">
          <strong>Sin acceso a este curso.</strong>
          <p>Esta aula no corresponde a tu perfil actual o aun no se te ha asignado.</p>
        </div>
      </div>
    );
  }

  const canManage = user.role === "administrador" && activeCourse.managedBy === "admin";
  const unlocked = user.role === "administrador" || isUnlockedForCourse(unlockMap, activeCourse.id, user.matricula);
  const showLearnerView = !canManage || adminPreviewMode;

  useEffect(() => {
    setGranted(unlocked);
  }, [unlocked, activeCourse.id]);

  function ensureProgressOpened() {
    if (!user.matricula || user.role === "administrador") return;
    const matricula = user.matricula;

    const next = upsertCourseProgress(progressMap, activeCourse.id, matricula, (existing) => {
      const now = new Date().toISOString();
      if (existing) {
        return {
          ...existing,
          progress: existing.progress === 0 ? 10 : existing.progress,
          status: existing.status === "sin_iniciar" ? "en_progreso" : existing.status,
          startedAt: existing.startedAt ?? now,
          lastViewedAt: now,
        };
      }

      return {
        id: crypto.randomUUID(),
        courseId: activeCourse.id,
        matricula,
        progress: 10,
        status: "en_progreso",
        startedAt: now,
        lastViewedAt: now,
      };
    });

    saveProgress(next);
  }

  function validateCode() {
    if (user.role === "administrador" || code.trim() === activeCourse.accessCode) {
      if (user.matricula && user.role !== "administrador") {
        saveUnlocks(unlockCourseForUser(unlockMap, activeCourse.id, user.matricula));
      }
      setGranted(true);
      setError("");
      ensureProgressOpened();
      return;
    }

    setError("La clave de acceso no es correcta.");
  }

  function createContent() {
    if (!canManage || !itemTitle.trim()) return;

    const nextItem: PortalCourseContent = {
      id: editingItemId || crypto.randomUUID(),
      courseId: activeCourse.id,
      type: itemType,
      title: itemTitle.trim(),
      description: itemDescription.trim(),
      resourceUrl: normalizeMediaUrl(resourceUrl),
      fileName: undefined,
      dueDate: itemType === "asignacion" && dueDate.trim() ? dueDate : undefined,
      createdAt:
        courseContent.find((item) => item.id === editingItemId)?.createdAt ?? new Date().toISOString(),
    };

    saveContent({
      ...contentMap,
      [activeCourse.id]: [nextItem, ...courseContent.filter((item) => item.id !== nextItem.id)],
    });

    setItemTitle("");
    setItemDescription("");
    setResourceUrl("");
    setDueDate("");
    setItemType("video");
    setEditingItemId("");
  }

  function editContent(item: PortalCourseContent) {
    setEditingItemId(item.id);
    setItemType(item.type);
    setItemTitle(item.title);
    setItemDescription(item.description);
    setResourceUrl(item.resourceUrl);
    setDueDate(item.dueDate ?? "");
  }

  function deleteContent(itemId: string) {
    if (!canManage) return;

    saveContent({
      ...contentMap,
      [activeCourse.id]: courseContent.filter((item) => item.id !== itemId),
    });

    if (editingItemId === itemId) {
      setEditingItemId("");
      setItemType("video");
      setItemTitle("");
      setItemDescription("");
      setResourceUrl("");
      setDueDate("");
    }
  }

  function deleteCurrentCourse() {
    if (!canManage) return;

    const nextCourses = courses.filter((item) => item.id !== activeCourse.id);
    const nextContentMap = { ...contentMap };
    const nextAssignmentMap = { ...assignmentMap };
    const nextProgressMap = { ...progressMap };
    const nextUnlockMap = { ...unlockMap };

    delete nextContentMap[activeCourse.id];
    delete nextAssignmentMap[activeCourse.id];
    delete nextProgressMap[activeCourse.id];
    delete nextUnlockMap[activeCourse.id];

    saveCourses(nextCourses);
    saveContent(nextContentMap);
    setAssignmentMap(nextAssignmentMap);
    window.localStorage.setItem(STORAGE_KEYS.courseAssignments, JSON.stringify(nextAssignmentMap));
    saveProgress(nextProgressMap);
    saveUnlocks(nextUnlockMap);
    window.location.href = "/lms";
  }

  function updateProgress(nextProgress: number, markComplete?: boolean, extra?: Partial<PortalCourseProgress>) {
    if (!user.matricula || user.role === "administrador") return;
    const matricula = user.matricula;

    const next = upsertCourseProgress(progressMap, activeCourse.id, matricula, (existing) => {
      const now = new Date().toISOString();
      const safeProgress = Math.max(existing?.progress ?? 0, nextProgress);
      return {
        id: existing?.id ?? crypto.randomUUID(),
        courseId: activeCourse.id,
        matricula,
        progress: markComplete ? 100 : Math.min(safeProgress, 100),
        status: markComplete || safeProgress >= 100 ? "completado" : "en_progreso",
        checklistCompletedIds: existing?.checklistCompletedIds ?? [],
        approvalStatus: existing?.approvalStatus ?? "none",
        startedAt: existing?.startedAt ?? now,
        lastViewedAt: now,
        completedAt: markComplete || safeProgress >= 100 ? now : existing?.completedAt,
        ...extra,
      };
    });

    saveProgress(next);
  }

  function toggleTask(itemId: string, checked: boolean) {
    if (!user.matricula || user.role === "administrador") return;

    const next = upsertCourseProgress(progressMap, activeCourse.id, user.matricula, (existing) => {
      const now = new Date().toISOString();
      const currentChecklist = existing?.checklistCompletedIds ?? [];
      const nextChecklist = checked
        ? [...currentChecklist, itemId]
        : currentChecklist.filter((value) => value !== itemId);
      const uniqueChecklist = Array.from(new Set(nextChecklist));
      const total = checklistItems.length || 1;
      const nextProgressValue = Math.round((uniqueChecklist.length / total) * 100);
      const completedAll = checklistItems.length > 0 && uniqueChecklist.length >= checklistItems.length;

      if (completedAll && existing?.approvalStatus !== "pending" && existing?.approvalStatus !== "approved") {
        const currentNotifications = JSON.parse(
          window.localStorage.getItem(STORAGE_KEYS.notifications) ?? "[]",
        ) as string[];
        const notification = `Revision de curso: ${user.matricula} completó ${activeCourse.title}`;
        if (!currentNotifications.includes(notification)) {
          window.localStorage.setItem(
            STORAGE_KEYS.notifications,
            JSON.stringify([notification, ...currentNotifications]),
          );
        }
      }

      return {
        id: existing?.id ?? crypto.randomUUID(),
        courseId: activeCourse.id,
        matricula: user.matricula ?? "",
        progress: nextProgressValue,
        status: completedAll ? "en_progreso" : nextProgressValue > 0 ? "en_progreso" : "sin_iniciar",
        checklistCompletedIds: uniqueChecklist,
        approvalStatus: completedAll ? "pending" : existing?.approvalStatus ?? "none",
        approvalRequestedAt: completedAll ? now : existing?.approvalRequestedAt,
        startedAt: existing?.startedAt ?? now,
        lastViewedAt: now,
        completedAt: existing?.completedAt,
      };
    });

    saveProgress(next);
  }

  function reviewCompletion(matricula: string, approved: boolean) {
    const next = upsertCourseProgress(progressMap, activeCourse.id, matricula, (existing) => {
      const now = new Date().toISOString();
      return {
        id: existing?.id ?? crypto.randomUUID(),
        courseId: activeCourse.id,
        matricula,
        progress: approved ? 100 : existing?.progress ?? 0,
        status: approved ? "completado" : "en_progreso",
        checklistCompletedIds: existing?.checklistCompletedIds ?? [],
        approvalStatus: approved ? "approved" : "rejected",
        approvalRequestedAt: existing?.approvalRequestedAt,
        reviewedAt: now,
        reviewedByName: user.position ?? user.matricula ?? "Administracion",
        startedAt: existing?.startedAt ?? now,
        lastViewedAt: existing?.lastViewedAt ?? now,
        completedAt: approved ? now : existing?.completedAt,
      };
    });

    saveProgress(next);
  }

  const assignedMembers = courseAssignments
    .map((assignment) => members.find((member) => member.matricula === assignment.matricula))
    .filter((member): member is PortalMember => Boolean(member));

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aula</p>
            <h1>{activeCourse.title}</h1>
            <p className="section-copy">{activeCourse.summary}</p>
          </div>
        </div>

        {!granted ? (
          <div className="stack-sm">
            <label className="field">
              <span>Ingresa la clave solo una vez para activar este curso</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <div className="hero-actions">
              <button type="button" className="primary-link action-button" onClick={validateCode}>
                Entrar al curso
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
          </div>
        ) : (
          <div className="stack-lg">
            {canManage ? (
              <div className="hero-actions">
                <button
                  type="button"
                  className={adminPreviewMode ? "primary-link action-button" : "secondary-link action-button"}
                  onClick={() => setAdminPreviewMode((current) => !current)}
                >
                  {adminPreviewMode ? "Volver a gestion admin" : "Ver como alumno"}
                </button>
              </div>
            ) : null}

            {showLearnerView && user.role !== "administrador" ? (
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Tu progreso</p>
                    <h2>{progress?.progress ?? 0}% completado</h2>
                    <p className="section-copy">
                      Tu avance se actualiza conforme completas cada tarea del curso. Cuando termines, administracion revisara tu cierre.
                    </p>
                  </div>
                </div>
                <div className="progress-bar" aria-hidden="true">
                  <span style={{ width: `${progress?.progress ?? 0}%` }} />
                </div>
                <div className="stack-sm">
                  {checklistItems.length ? (
                    checklistItems.map((item) => {
                      const checked = completedChecklist.includes(item.id);
                      return (
                        <label key={item.id} className="role-mini-card lms-checklist-item">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => toggleTask(item.id, event.target.checked)}
                          />
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.description || "Tarea del curso"}</p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <strong>Aún no hay tareas cargadas en este curso.</strong>
                    </div>
                  )}
                </div>
                <div className="hero-actions">
                  <span className="pill">
                    {progress?.approvalStatus === "pending"
                      ? "En revisión administrativa"
                      : progress?.approvalStatus === "approved"
                        ? "Aprobado"
                        : progress?.approvalStatus === "rejected"
                          ? "Revisión pendiente de ajustes"
                          : "Sigue completando tareas"}
                  </span>
                </div>
              </section>
            ) : null}

            {showLearnerView && user.role === "administrador" ? (
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Vista alumno</p>
                    <h2>Asi se ve este curso para talento</h2>
                    <p className="section-copy">
                      Aqui revisas el contenido publicado y el flujo visible para novatos y usuarios sin salir del curso.
                    </p>
                  </div>
                </div>
                <div className="stack-sm">
                  {checklistItems.length ? (
                    checklistItems.map((item) => (
                      <label key={item.id} className="role-mini-card lms-checklist-item">
                        <input type="checkbox" checked={false} readOnly />
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.description || "Tarea del curso"}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="empty-state">
                      <strong>Aun no hay tareas cargadas en este curso.</strong>
                    </div>
                  )}
                </div>
                <div className="hero-actions">
                  <Link href="/lms" className="secondary-link action-button">
                    Volver a cursos
                  </Link>
                </div>
              </section>
            ) : null}

            {canManage ? (
              <section className="role-mini-card">
                <strong>Administrar contenido</strong>
                <p>
                  Sube recursos para esta clase: texto, fotos, videos, blogs, archivos o
                  asignaciones.
                </p>
                <div className="form-grid">
                  <label className="field">
                    <span>Tipo</span>
                    <select
                      className="field-select"
                      value={itemType}
                      onChange={(event) => setItemType(event.target.value as PortalCourseContent["type"])}
                    >
                      <option value="texto">Texto</option>
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
                    <span>Contenido o descripcion</span>
                    <textarea
                      value={itemDescription}
                      onChange={(event) => setItemDescription(event.target.value)}
                      rows={4}
                    />
                  </label>
                  <label className="field">
                    <span>Enlace del recurso</span>
                    <input
                      type="url"
                      value={resourceUrl}
                      onChange={(event) => setResourceUrl(event.target.value)}
                      placeholder="https://drive.google.com/... o https://..."
                    />
                  </label>
                  {itemType === "asignacion" ? (
                    <label className="field">
                      <span>Fecha limite</span>
                      <input
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        placeholder="2026-03-30"
                      />
                    </label>
                  ) : null}
                </div>
                <div className="hero-actions">
                  <button type="button" className="primary-link action-button" onClick={createContent}>
                    {editingItemId ? "Guardar cambios" : "Publicar contenido"}
                  </button>
                  {editingItemId ? (
                    <button
                      type="button"
                      className="secondary-link action-button"
                      onClick={() => {
                        setEditingItemId("");
                        setItemType("video");
                        setItemTitle("");
                        setItemDescription("");
                        setResourceUrl("");
                        setDueDate("");
                      }}
                    >
                      Cancelar edicion
                    </button>
                  ) : null}
                  <button type="button" className="secondary-link action-button" onClick={deleteCurrentCourse}>
                    Borrar curso
                  </button>
                </div>
              </section>
            ) : null}

            {canManage ? (
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Participantes</p>
                    <h2>Seguimiento del grupo</h2>
                  </div>
                </div>
                <div className="card-grid card-grid-3">
                  {assignedMembers.map((member) => {
                    const memberProgress = getProgressForUser(progressMap, activeCourse.id, member.matricula);
                    return (
                      <article key={member.matricula} className="role-mini-card">
                        <strong>{member.name}</strong>
                        <p>{member.position}</p>
                        <span>{member.company}</span>
                        <p>Progreso: {memberProgress?.progress ?? 0}%</p>
                        <p>
                          Estado:
                          {" "}
                          {memberProgress?.approvalStatus === "pending"
                            ? "Pendiente de aprobación"
                            : memberProgress?.approvalStatus === "approved"
                              ? "Aprobado"
                              : memberProgress?.approvalStatus === "rejected"
                                ? "Rechazado"
                                : "En curso"}
                        </p>
                        {memberProgress?.approvalStatus === "pending" ? (
                          <div className="hero-actions">
                            <button
                              type="button"
                              className="primary-link action-button"
                              onClick={() => reviewCompletion(member.matricula, true)}
                            >
                              Aprobar avance
                            </button>
                            <button
                              type="button"
                              className="secondary-link action-button"
                              onClick={() => reviewCompletion(member.matricula, false)}
                            >
                              Pedir ajustes
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                  {!assignedMembers.length ? (
                    <div className="empty-state">
                      <strong>Sin participantes asignados todavia.</strong>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="stack-sm">
              {courseContent.length ? (
                courseContent.map((item) => (
                  <article key={item.id} className="role-mini-card">
                    <strong>{item.title}</strong>
                    <p>{item.description || "Sin descripcion adicional."}</p>
                    <span>{item.type}</span>
                    {item.resourceUrl && isImageLikeUrl(item.resourceUrl) ? (
                      <img src={normalizeMediaUrl(item.resourceUrl)} alt={item.title} className="post-image" />
                    ) : null}
                    {item.resourceUrl && isVideoLikeUrl(item.resourceUrl) ? (
                      <video controls className="post-image">
                        <source src={normalizeMediaUrl(item.resourceUrl)} />
                      </video>
                    ) : null}
                    {item.resourceUrl && !isImageLikeUrl(item.resourceUrl) && !isVideoLikeUrl(item.resourceUrl) ? (
                      <a href={normalizeMediaUrl(item.resourceUrl)} target="_blank" rel="noreferrer" className="secondary-link">
                        Abrir recurso
                      </a>
                    ) : null}
                    {item.dueDate ? <p>Entrega: {item.dueDate}</p> : null}
                    {canManage ? (
                      <div className="hero-actions">
                        <button
                          type="button"
                          className="secondary-link action-button"
                          onClick={() => editContent(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="secondary-link action-button"
                          onClick={() => deleteContent(item.id)}
                        >
                          Borrar
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <strong>El curso esta vacio por ahora.</strong>
                  <p>
                    Este espacio ya esta desbloqueado y listo para textos, videos, archivos,
                    blogs y asignaciones.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
