export type UserRole = "administrador" | "novato" | "usuario";

export type UserProfile = {
  id: string;
  matricula: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  company?: string;
  photoUrl?: string;
};
