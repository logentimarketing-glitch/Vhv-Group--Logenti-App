import { courseTemplates, PortalCourse, PortalMember, STORAGE_KEYS, memberSeeds } from "@/lib/portal-seeds";
import { isUserEligibleForCourse } from "@/lib/course-eligibility";
import { readStorage } from "@/lib/storage";
import { getDemoUserByMatricula } from "@/lib/mock-auth";
import { getUserStatus } from "@/lib/user-status";

export const PERSONAL_COMPANIES = ["VHV Group", "Morsa", "OUI", "Elektra", "BAZ", "Italika"] as const;

export type PersonalStatus = "todos" | "activo" | "en-capacitacion" | "administrativo";

export function normalizeMemberCompany(member: PortalMember) {
  return member.company === "VHV" ? { ...member, company: "VHV Group" } : member;
}

function alignMemberWithDemoAccount(member: PortalMember) {
  const demoUser = getDemoUserByMatricula(member.matricula);
  if (!demoUser) return normalizeMemberCompany(member);

  return normalizeMemberCompany({
    ...member,
    role: demoUser.role,
    status: demoUser.status,
    name: demoUser.name,
    email: demoUser.email,
    position: demoUser.position,
    company: demoUser.company ?? member.company,
  });
}

export function readMemberDirectory() {
  const stored = readStorage<PortalMember[]>(STORAGE_KEYS.members, []);
  const mergedMap = new Map<string, PortalMember>();

  [...stored.map(alignMemberWithDemoAccount), ...memberSeeds.map(alignMemberWithDemoAccount)].forEach((member) => {
    mergedMap.set(member.matricula, member);
  });

  return Array.from(mergedMap.values());
}

export function getMemberStatus(member: PortalMember): Exclude<PersonalStatus, "todos"> {
  const status = getUserStatus(member);
  if (status === "TRAINEE") return "en-capacitacion";
  if (status === "ACTIVE_EMPLOYEE") return "activo";
  return "administrativo";
}

export function getMemberEligibleCourses(member: PortalMember, courses: PortalCourse[] = courseTemplates) {
  return courses.filter((course) =>
    isUserEligibleForCourse(
      {
        matricula: member.matricula,
        role: member.role,
        company: member.company,
        position: member.position,
      },
      course,
    ),
  );
}
