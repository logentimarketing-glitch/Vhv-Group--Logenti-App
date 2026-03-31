"use client";

import { useEffect, useMemo, useState } from "react";
import {
  courseTemplates,
  PortalCourse,
  PortalCourseAssignment,
  PortalCourseProgress,
  STORAGE_KEYS,
} from "@/lib/portal-seeds";
import { getDefaultProfile, getProfileStorageKey, resolveStoredProfile, StoredProfile } from "@/lib/profile";
import { readStorage } from "@/lib/storage";
import { canUserSeeCourse, getProgressForUser } from "@/lib/lms-progress";
import { isUserEligibleForCourse } from "@/lib/course-eligibility";
import { getUserStatus, isTrainee } from "@/lib/user-status";

type MemberFeedProps = {
  user: {
    matricula: string;
    name: string;
    email: string;
    position: string;
    role: "administrador" | "novato" | "usuario";
    company?: string;
  };
  admins: {
    matricula: string;
    name: string;
    email: string;
    position: string;
  }[];
};

export function MemberFeed({ user, admins }: MemberFeedProps) {
  const [profile, setProfile] = useState<StoredProfile>(getDefaultProfile(user));
  const [courses, setCourses] = useState<PortalCourse[]>(courseTemplates);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, PortalCourseAssignment[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, PortalCourseProgress[]>>({});
  const status = getUserStatus(user);
  const traineeMode = isTrainee(user);
  const visibleAdmins = traineeMode
    ? admins.filter((admin) => /reclut|atraccion de talento|rrhh|desarrollo organizacional/i.test(admin.position))
    : admins;

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(getProfileStorageKey(user.matricula));
    if (rawProfile) {
      try {
        setProfile(resolveStoredProfile(user, JSON.parse(rawProfile) as StoredProfile));
      } catch {}
    }

    setCourses(readStorage<PortalCourse[]>(STORAGE_KEYS.courses, courseTemplates));
    setAssignmentMap(readStorage<Record<string, PortalCourseAssignment[]>>(STORAGE_KEYS.courseAssignments, {}));
    setProgressMap(readStorage<Record<string, PortalCourseProgress[]>>(STORAGE_KEYS.courseProgress, {}));
  }, [user]);

  const visibleCourses = useMemo(
    () =>
      courses.filter((course) =>
        canUserSeeCourse(
          course,
          user,
          isUserEligibleForCourse(
            {
              matricula: user.matricula,
              role: user.role,
              company: user.company,
              position: user.position,
            },
            course,
          ),
          assignmentMap[course.id] ?? [],
        ),
      ),
    [assignmentMap, courses, user],
  );

  const completedCourses = useMemo(
    () =>
      visibleCourses.filter((course) => {
        const progress = getProgressForUser(progressMap, course.id, user.matricula);
        return progress?.status === "completado" || (progress?.progress ?? 0) >= 100;
      }),
    [progressMap, user.matricula, visibleCourses],
  );

  const lockedCourses = useMemo(
    () => (traineeMode ? courses.filter((course) => course.role === "usuario") : []),
    [courses, traineeMode],
  );

  return (
    <div className="member-feed-layout">
      <section
        className={`facebook-profile-shell ${
          status === "ACTIVE_EMPLOYEE" ? "status-shell-active" : "status-shell-trainee"
        }`}
      >
        <div className="facebook-cover" />
        <div className="facebook-profile-head">
          {!traineeMode ? (
            <div className="facebook-avatar">
              {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : <span>{profile.name.slice(0, 1)}</span>}
            </div>
          ) : null}
          <div className="facebook-profile-copy">
            <span className={`status-pill ${status === "ACTIVE_EMPLOYEE" ? "status-pill-active" : "status-pill-trainee"}`}>
              {status === "TRAINEE" ? "TRAINEE" : "ACTIVE_EMPLOYEE"}
            </span>
            <h1>{user.name}</h1>
            <p>{user.position}</p>
            <span>{traineeMode ? "Acceso guiado" : user.company || "Logenti"}</span>
          </div>
        </div>
      </section>

      <section className="member-feed-columns">
        <aside className="role-surface">
          <p className="role-section-label">Logros</p>
          <h2>{traineeMode ? "Tu avance inicial" : "Insignias obtenidas"}</h2>
          <div className="stack-sm">
            <div className="role-mini-card">
              <strong>Cursos inscritos</strong>
              <p>{visibleCourses.length}</p>
            </div>
            <div className="role-mini-card">
              <strong>Cursos completados</strong>
              <p>{completedCourses.length}</p>
            </div>
            {completedCourses.length ? (
              completedCourses.map((course) => (
                <div key={course.id} className="role-mini-card">
                  <strong>Insignia obtenida</strong>
                  <p>{course.title}</p>
                </div>
              ))
            ) : (
              <div className="role-mini-card">
                <strong>Sin insignias todavia</strong>
                <p>Completa tus cursos para que tus logros aparezcan aqui.</p>
              </div>
            )}
            <div className="role-mini-card">
              <strong>Administracion visible</strong>
              <p>{visibleAdmins.length} perfil(es) de VHV Group pueden darte seguimiento.</p>
            </div>
          </div>
        </aside>

        <section className="stack-md">
          <article className="role-surface">
            <p className="role-section-label">Cursos</p>
            <h2>{traineeMode ? "Onboarding inscrito" : "Tus cursos activos"}</h2>
            <div className="stack-sm">
              {visibleCourses.length ? (
                visibleCourses.map((course) => {
                  const progress = getProgressForUser(progressMap, course.id, user.matricula);
                  const progressValue = progress?.progress ?? 0;

                  return (
                    <article key={course.id} className="social-card">
                      <strong>{course.title}</strong>
                      <p>{course.summary}</p>
                      <span className="pill subtle">{course.role}</span>
                      <div className="progress-bar" aria-hidden="true">
                        <span style={{ width: `${progressValue}%` }} />
                      </div>
                      <p>Progreso: {progressValue}%</p>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <strong>Aun no tienes cursos asignados.</strong>
                  <p>Cuando administracion te habilite cursos, apareceran aqui.</p>
                </div>
              )}
            </div>
          </article>

          {traineeMode ? (
            <article className="role-surface">
              <p className="role-section-label">Bloqueados</p>
              <h2>Se activan cuando subas de nivel</h2>
              <div className="stack-sm">
                {lockedCourses.length ? (
                  lockedCourses.map((course) => (
                    <article key={course.id} className="social-card">
                      <strong>{course.title}</strong>
                      <p>{course.summary}</p>
                      <span className="pill subtle">Nivel usuario</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>Sin cursos bloqueados visibles.</strong>
                  </div>
                )}
              </div>
            </article>
          ) : (
            <article className="role-surface">
              <p className="role-section-label">VHV Group</p>
              <h2>Personas visibles para tu cuenta</h2>
              <div className="stack-sm">
                {visibleAdmins.map((admin) => (
                  <div key={admin.matricula} className="role-directory-row">
                    <div className="avatar-badge">{admin.name.slice(0, 1)}</div>
                    <div>
                      <strong>{admin.name}</strong>
                      <p>{admin.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      </section>
    </div>
  );
}
