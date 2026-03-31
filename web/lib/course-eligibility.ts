import { demoUsers } from "@/lib/mock-auth";
import { courseTemplates, type PortalCourse } from "@/lib/portal-seeds";
import { getUserStatus } from "@/lib/user-status";

type EligibilityUser = {
  matricula: string;
  role: "administrador" | "novato" | "usuario";
  company?: string;
  position?: string;
};

function normalize(value: string | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function getEligibleCoursesForUser(user: EligibilityUser) {
  return courseTemplates.filter((course) => isUserEligibleForCourse(user, course));
}

export function isUserEligibleForCourse(user: EligibilityUser, course: PortalCourse) {
  const userStatus = getUserStatus(user);
  const statusAllowed =
    !course.allowedStatuses?.length || course.allowedStatuses.includes(userStatus);

  if (user.role === "administrador") {
    if (!statusAllowed) return false;

    if (course.role !== "administrador") {
      return true;
    }

    if (course.managedBy === "master") {
      return normalize(user.matricula) === "271003";
    }
  }

  if (!statusAllowed) {
    return false;
  }

  if (course.role !== user.role && !course.allowedStatuses?.includes(userStatus)) {
    return false;
  }

  const companyAllowed =
    !course.allowedCompanies?.length ||
    course.allowedCompanies.some((company) => normalize(company) === normalize(user.company));

  const positionAllowed =
    !course.allowedPositions?.length ||
    course.allowedPositions.some((position) =>
      normalize(user.position).includes(normalize(position)),
    );

  return companyAllowed && positionAllowed;
}

export function findUserByMatricula(matricula: string) {
  return demoUsers.find((user) => user.matricula === matricula.trim());
}

export function resolveCourseKeyForUser(matricula: string, requestedCourseId?: string) {
  const user = findUserByMatricula(matricula);

  if (!user) {
    return {
      ok: false as const,
      message: "No encontré esa matrícula en el sistema.",
      eligibleCourses: [],
    };
  }

  const eligibleCourses = getEligibleCoursesForUser(user).filter((course) => course.visibleInBot !== false);

  if (!eligibleCourses.length) {
    return {
      ok: false as const,
      message: "Tu perfil todavía no tiene cursos habilitados. Un administrador puede activarlos.",
      eligibleCourses: [],
    };
  }

  if (requestedCourseId) {
    const course = eligibleCourses.find((item) => item.id === requestedCourseId);

    if (!course) {
      return {
        ok: false as const,
        message: "Tu matrícula no está calificada para ese curso.",
        eligibleCourses,
      };
    }

    return {
      ok: true as const,
      message: `La clave de ${course.title} es ${course.accessCode}.`,
      eligibleCourses,
      course,
    };
  }

  if (eligibleCourses.length === 1) {
    const [course] = eligibleCourses;

    return {
      ok: true as const,
      message: `La clave de ${course.title} es ${course.accessCode}.`,
      eligibleCourses,
      course,
    };
  }

  return {
    ok: true as const,
    message: "Tu matrícula tiene más de un curso habilitado. Elige cuál quieres consultar.",
    eligibleCourses,
  };
}
