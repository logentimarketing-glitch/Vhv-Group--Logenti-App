import {
  courseTemplates,
  PortalCourse,
  PortalCourseAssignment,
  PortalCourseContent,
  PortalCourseProgress,
  STORAGE_KEYS,
} from "@/lib/portal-seeds";
import { readStorage, writeStorage } from "@/lib/storage";

export const LMS_STORAGE_VERSION = "2026-03-31-clean-reset";

const LEGACY_COURSE_TITLES = new Set(["Manual", "Oui", "Induccion inicial"]);

export function shouldResetLegacyCourses(courses: unknown) {
  if (!Array.isArray(courses)) return false;

  return courses.some((course) => {
    if (!course || typeof course !== "object") return false;
    const title = "title" in course ? String(course.title) : "";
    return LEGACY_COURSE_TITLES.has(title);
  });
}

export function migrateLmsStorageIfNeeded() {
  const version = readStorage<string>(STORAGE_KEYS.lmsVersion, "");
  const storedCourses = readStorage<PortalCourse[]>(STORAGE_KEYS.courses, courseTemplates);
  const needsReset =
    version !== LMS_STORAGE_VERSION || shouldResetLegacyCourses(storedCourses);

  if (!needsReset) {
    return {
      courses: storedCourses,
      contentMap: readStorage<Record<string, PortalCourseContent[]>>(STORAGE_KEYS.courseContent, {}),
      assignmentMap: readStorage<Record<string, PortalCourseAssignment[]>>(
        STORAGE_KEYS.courseAssignments,
        {},
      ),
      progressMap: readStorage<Record<string, PortalCourseProgress[]>>(STORAGE_KEYS.courseProgress, {}),
      unlockMap: readStorage<Record<string, string[]>>(STORAGE_KEYS.courseUnlocks, {}),
    };
  }

  writeStorage(STORAGE_KEYS.courses, courseTemplates);
  writeStorage(STORAGE_KEYS.courseContent, {});
  writeStorage(STORAGE_KEYS.courseAssignments, {});
  writeStorage(STORAGE_KEYS.courseProgress, {});
  writeStorage(STORAGE_KEYS.courseUnlocks, {});
  writeStorage(STORAGE_KEYS.lmsVersion, LMS_STORAGE_VERSION);

  return {
    courses: courseTemplates,
    contentMap: {} as Record<string, PortalCourseContent[]>,
    assignmentMap: {} as Record<string, PortalCourseAssignment[]>,
    progressMap: {} as Record<string, PortalCourseProgress[]>,
    unlockMap: {} as Record<string, string[]>,
  };
}
