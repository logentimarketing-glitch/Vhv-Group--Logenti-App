export type UserStatus = "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";

type StatusUser = {
  role?: "administrador" | "novato" | "usuario";
  status?: UserStatus;
  company?: string;
};

export function getUserStatus(user: StatusUser | null | undefined): UserStatus {
  if (!user) return "ACTIVE_EMPLOYEE";
  if (user.status) return user.status;
  if (user.role === "administrador") return "ADMIN";
  if (user.role === "novato") return "TRAINEE";
  return "ACTIVE_EMPLOYEE";
}

export function isTrainee(user: StatusUser | null | undefined) {
  return getUserStatus(user) === "TRAINEE";
}

export function isActiveEmployee(user: StatusUser | null | undefined) {
  return getUserStatus(user) === "ACTIVE_EMPLOYEE";
}

export function isAdminStatus(user: StatusUser | null | undefined) {
  return getUserStatus(user) === "ADMIN";
}

export function getStatusLabel(status: UserStatus) {
  if (status === "TRAINEE") return "En onboarding";
  if (status === "ACTIVE_EMPLOYEE") return "Empleado activo";
  return "Administracion";
}

export function canActiveEmployeeViewMember(
  viewer: { company?: string },
  member: { company?: string; status?: UserStatus; role?: "administrador" | "novato" | "usuario" },
) {
  const memberStatus = getUserStatus(member);
  if (memberStatus === "ADMIN") return true;
  return Boolean(viewer.company && member.company === viewer.company && memberStatus === "ACTIVE_EMPLOYEE");
}

