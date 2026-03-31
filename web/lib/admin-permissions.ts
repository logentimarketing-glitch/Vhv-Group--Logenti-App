type AdminUser = {
  role: "administrador" | "novato" | "usuario";
  position: string;
  isMaster?: boolean;
};

export type AdminPermissions = {
  controlLabel: string;
  canAccessControl: boolean;
  canManageVacancies: boolean;
  canManageCandidates: boolean;
  canSyncMetaLeads: boolean;
  canManageCourses: boolean;
  canManageNews: boolean;
  canManageMarketing: boolean;
  canManagePeopleLevels: boolean;
  canPromoteAdministrators: boolean;
};

export function getAdminPermissions(user: AdminUser): AdminPermissions {
  if (user.role !== "administrador") {
    return {
      controlLabel: "Tu espacio",
      canAccessControl: false,
      canManageVacancies: false,
      canManageCandidates: false,
      canSyncMetaLeads: false,
      canManageCourses: false,
      canManageNews: false,
      canManageMarketing: false,
      canManagePeopleLevels: false,
      canPromoteAdministrators: false,
    };
  }

  if (user.isMaster) {
    return {
      controlLabel: "Centro maestro",
      canAccessControl: true,
      canManageVacancies: true,
      canManageCandidates: true,
      canSyncMetaLeads: true,
      canManageCourses: true,
      canManageNews: true,
      canManageMarketing: true,
      canManagePeopleLevels: true,
      canPromoteAdministrators: true,
    };
  }

  return {
    controlLabel: "Panel operativo",
    canAccessControl: true,
    canManageVacancies: true,
    canManageCandidates: true,
    canSyncMetaLeads: true,
    canManageCourses: true,
    canManageNews: true,
    canManageMarketing: true,
    canManagePeopleLevels: true,
    canPromoteAdministrators: false,
  };
}
