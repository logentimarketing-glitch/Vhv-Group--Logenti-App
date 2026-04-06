import { demoUsers } from "@/lib/mock-auth";
import { UserStatus } from "@/lib/user-status";

export type PortalCourse = {
  id: string;
  title: string;
  role: "novato" | "usuario" | "administrador";
  allowedStatuses?: UserStatus[];
  accessCode: string;
  summary: string;
  managedBy: "admin" | "master";
  kind: "curso" | "manual-admin";
  allowedCompanies?: string[];
  allowedPositions?: string[];
  visibleInBot?: boolean;
};

export type PortalCourseContent = {
  id: string;
  courseId: string;
  type: "texto" | "foto" | "video" | "blog" | "archivo" | "asignacion";
  title: string;
  description: string;
  resourceUrl: string;
  fileName?: string;
  dueDate?: string;
  createdAt: string;
};

export type PortalCourseAssignment = {
  id: string;
  courseId: string;
  matricula: string;
  assignedByMatricula: string;
  assignedByName: string;
  assignedAt: string;
};

export type PortalCourseProgress = {
  id: string;
  courseId: string;
  matricula: string;
  progress: number;
  status: "sin_iniciar" | "en_progreso" | "completado";
  checklistCompletedIds?: string[];
  approvalStatus?: "none" | "pending" | "approved" | "rejected";
  approvalRequestedAt?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  startedAt?: string;
  lastViewedAt?: string;
  completedAt?: string;
};

export type PortalNews = {
  id: string;
  title: string;
  type: string;
  summary: string;
  authorRole: string;
  authorMatricula: string;
  authorName: string;
  imageUrl?: string;
  imageName?: string;
  status: "pendiente" | "aprobado" | "rechazado";
  submittedAt?: string;
  approvedAt?: string;
  approvedByMatricula?: string;
  approvedByName?: string;
  rejectedAt?: string;
  rejectedByMatricula?: string;
  rejectedByName?: string;
  rejectionReason?: string;
  starredBy: string[];
  comments: {
    id: string;
    authorMatricula: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  repostOfId?: string;
  repostPreview?: {
    title: string;
    authorName: string;
    summary: string;
  };
  createdAt: string;
};

export type PortalVacancy = {
  id: string;
  title: string;
  area: string;
  status: string;
};

export type PortalCandidate = {
  id: string;
  name: string;
  role: string;
  source: string;
  notes: string;
  aiDecisionReason: string;
  externalId?: string;
  company?: string;
  score?: number;
  recruiterMatricula?: string;
  recruiterName?: string;
  createdAt?: string;
  tags?: string[];
  history?: {
    id: string;
    label: string;
    detail: string;
    createdAt: string;
  }[];
  stage: "Nuevo" | "Filtro IA" | "Entrevista" | "Aprobado" | "Contratado" | "Descartado";
};

export type PortalMember = {
  matricula: string;
  name: string;
  role: "administrador" | "novato" | "usuario";
  status: UserStatus;
  email: string;
  position: string;
  company: string;
  isDemoBot?: boolean;
};

export type PortalSupportThread = {
  id: string;
  senderMatricula: string;
  senderName: string;
  senderRole: "administrador" | "novato" | "usuario";
  question: string;
  botReply: string;
  quickAction?: string;
  escalated: boolean;
  adminReply?: string;
  status: "Bot" | "Pendiente admin" | "Respondido";
  createdAt: string;
};

export type PortalConnection = {
  id: string;
  users: [string, string];
  createdAt: string;
  createdBy: string;
};

export type PortalDirectMessage = {
  id: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  content: string;
  createdAt: string;
};

export const courseTemplates: PortalCourse[] = [
  {
    id: "curso-induccion",
    title: "Induccion",
    role: "novato",
    allowedStatuses: ["TRAINEE", "ACTIVE_EMPLOYEE"],
    accessCode: "INDUCCION01",
    summary:
      "Curso base de bienvenida para personal de nuevo ingreso. El contenido se puede cargar desde administracion.",
    managedBy: "admin",
    kind: "curso",
    visibleInBot: true,
  },
];

export const supportFaq = [
  {
    id: "faq-curso",
    question: "Como obtengo la clave de mi curso",
    answer:
      "Usa la opcion rapida de clave de grupo. El sistema validara tu matricula, tu rol y tu empresa antes de compartir el codigo del curso.",
  },
  {
    id: "faq-acceso",
    question: "No puedo entrar a la plataforma",
    answer:
      "Revisa tu matricula, tu contrasena y que tu perfil ya haya sido activado. Si persiste, el bot puede escalar tu caso a un administrador.",
  },
  {
    id: "faq-documentos",
    question: "Que documentos internos necesito para mi alta y seguimiento",
    answer:
      "Normalmente se solicitan identificacion, documentos fiscales y los requisitos internos del cliente o marca. Si tu caso requiere algo especial, soporte lo escala.",
  },
  {
    id: "faq-soporte",
    question: "Necesito hablar con una persona",
    answer:
      "Si tu duda es compleja o urgente, el bot deja el hilo marcado para respuesta humana y un administrador puede contestarte desde la bandeja de soporte.",
  },
] as const;

export const STORAGE_KEYS = {
  lmsVersion: "vhv-lms-version",
  courses: "vhv-courses",
  news: "vhv-news",
  vacancies: "vhv-vacancies",
  candidates: "vhv-candidates",
  members: "vhv-members",
  support: "vhv-support",
  courseContent: "vhv-course-content",
  courseAssignments: "vhv-course-assignments",
  courseProgress: "vhv-course-progress",
  courseUnlocks: "vhv-course-unlocks",
  connections: "vhv-connections",
  personalDirectory: "vhv-personal-directory",
  directMessages: "vhv-direct-messages",
  notifications: "vhv-notifications",
} as const;

export const memberSeeds: PortalMember[] = demoUsers.map((user) => {
  const isDemoBot = user.matricula === "240201" || user.matricula === "778901";

  return {
    matricula: user.matricula,
    name: user.name,
    role: user.role,
    status: user.status,
    email: user.email,
    position: user.position,
    company: isDemoBot ? "" : user.company ?? "Logenti",
    isDemoBot,
  };
});
