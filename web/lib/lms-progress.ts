import {
  PortalCourse,
  PortalCourseAssignment,
  PortalCourseProgress,
} from "@/lib/portal-seeds";
import { getUserStatus } from "@/lib/user-status";

type ProgressUser = {
  matricula?: string;
  role: "administrador" | "novato" | "usuario";
  company?: string;
  position?: string;
};

export function isAssignedToCourse(
  assignments: PortalCourseAssignment[],
  courseId: string,
  matricula?: string,
) {
  if (!matricula) return false;
  return assignments.some(
    (assignment) =>
      assignment.courseId === courseId && assignment.matricula === matricula,
  );
}

export function isUnlockedForCourse(
  unlockMap: Record<string, string[]>,
  courseId: string,
  matricula?: string,
) {
  if (!matricula) return false;
  return (unlockMap[courseId] ?? []).includes(matricula);
}

export function unlockCourseForUser(
  current: Record<string, string[]>,
  courseId: string,
  matricula: string,
) {
  const existing = current[courseId] ?? [];
  if (existing.includes(matricula)) {
    return current;
  }

  return {
    ...current,
    [courseId]: [...existing, matricula],
  };
}

export function canUserSeeCourse(
  course: PortalCourse,
  user: ProgressUser,
  eligible: boolean,
  assignments: PortalCourseAssignment[],
) {
  const status = getUserStatus(user);

  if (user.role === "administrador") {
    if (course.allowedStatuses?.length) {
      return course.allowedStatuses.includes(status);
    }
    return true;
  }

  const assigned = isAssignedToCourse(assignments, course.id, user.matricula);

  if (status === "TRAINEE") {
    return eligible || assigned;
  }

  if (status === "ACTIVE_EMPLOYEE") {
    return assigned || (course.id === "curso-induccion" && eligible);
  }

  return eligible || assigned;
}

export function getProgressForUser(
  progressMap: Record<string, PortalCourseProgress[]>,
  courseId: string,
  matricula?: string,
) {
  if (!matricula) return null;
  return (
    progressMap[courseId]?.find((entry) => entry.matricula === matricula) ?? null
  );
}

export function upsertCourseProgress(
  current: Record<string, PortalCourseProgress[]>,
  courseId: string,
  matricula: string,
  updater: (existing: PortalCourseProgress | null) => PortalCourseProgress,
) {
  const courseEntries = current[courseId] ?? [];
  const existing = courseEntries.find((entry) => entry.matricula === matricula) ?? null;
  const nextEntry = updater(existing);
  const filtered = courseEntries.filter((entry) => entry.matricula !== matricula);

  return {
    ...current,
    [courseId]: [nextEntry, ...filtered],
  };
}
