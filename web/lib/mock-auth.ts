import { UserStatus } from "@/lib/user-status";

export type DemoRole = "administrador" | "novato" | "usuario";

export type DemoUser = {
  matricula: string;
  password: string;
  role: DemoRole;
  status: UserStatus;
  name: string;
  email: string;
  position: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  state?: string;
  branch?: string;
  isMaster?: boolean;
  showInPortal?: boolean;
};

export const demoUsers: DemoUser[] = [
  {
    matricula: "271003",
    password: "L0genti128",
    role: "administrador",
    status: "ADMIN",
    name: "Logenti",
    email: "master@logenti.app",
    position: "adminvhv",
    company: "VHV Group",
    isMaster: true,
    showInPortal: true,
  },
  {
    matricula: "271201",
    password: "Vhv271V!",
    role: "administrador",
    status: "ADMIN",
    name: "Variana Vergara",
    email: "variana.vergara@logenti.com",
    position: "Analista de administracion de personal",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271202",
    password: "Vhv271Q!",
    role: "administrador",
    status: "ADMIN",
    name: "Quetzali Cruz",
    email: "quetzali.cruz@vhvgroup.com",
    position: "Reclutador",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271203",
    password: "Vhv271B!",
    role: "administrador",
    status: "ADMIN",
    name: "Brianda Benitez",
    email: "brianda.benitez@vhvgroup.com",
    position: "Gerente de RRHH",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271204",
    password: "Vhv271F!",
    role: "administrador",
    status: "ADMIN",
    name: "Fabian Flores",
    email: "fabian.flores@vhvgroup.com",
    position: "Coordinador de desarrollo organizacional",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "220203",
    password: "271003",
    role: "administrador",
    status: "ADMIN",
    name: "Erika Luna",
    email: "logenti.marketing@vhvgroup.mx",
    position: "Becaria Marketing /Comunicacion",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271205",
    password: "Vhv271A!",
    role: "administrador",
    status: "ADMIN",
    name: "Adrian Vega",
    email: "reclutamientobecario@vhvgroup.mx",
    position: "Reclutamiento becario",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271208",
    password: "Vhv271M!",
    role: "administrador",
    status: "ADMIN",
    name: "Michelle Calleja",
    email: "michelle@vhvgroup.mx",
    position: "Administrativo",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "271207",
    password: "Vhv271R!",
    role: "administrador",
    status: "ADMIN",
    name: "Becario Reclutamiento",
    email: "becarioreclutamiento@vhvgroup.mx",
    position: "Becario reclutamiento",
    company: "VHV Group",
    showInPortal: true,
  },
  {
    matricula: "240201",
    password: "Tal240N!",
    role: "novato",
    status: "TRAINEE",
    name: "Novato Logenti",
    email: "",
    position: "Bot demo de onboarding",
    firstName: "Novato",
    lastName: "Logenti",
    state: "Sin asignar",
    branch: "Sin sucursal",
    showInPortal: false,
  },
  {
    matricula: "778901",
    password: "Tal778U!",
    role: "usuario",
    status: "ACTIVE_EMPLOYEE",
    name: "Usuario Logenti",
    email: "",
    position: "Bot demo de usuario activo",
    showInPortal: false,
  },
];

export function findDemoUser(matricula: string, password: string) {
  return demoUsers.find(
    (user) => user.matricula === matricula.trim().toUpperCase() && user.password === password,
  );
}

export function parseSessionToken(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(":");
  const matricula = parts[parts.length - 1];
  return demoUsers.find((user) => user.matricula === matricula) ?? null;
}

export function getDemoUserByMatricula(matricula: string) {
  return demoUsers.find((user) => user.matricula === matricula);
}

export function isProtectedAdministrativeUser(matricula: string) {
  const user = getDemoUserByMatricula(matricula);
  return Boolean(user && user.role === "administrador" && user.showInPortal);
}
