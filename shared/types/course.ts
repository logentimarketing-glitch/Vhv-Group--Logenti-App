export type CourseLevel = "administrador" | "novato" | "usuario";

export type Course = {
  id: string;
  title: string;
  level: CourseLevel;
  accessCode: string;
  format: string;
  summary: string;
};
