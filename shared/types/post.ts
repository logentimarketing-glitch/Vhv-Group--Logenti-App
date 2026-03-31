export type CommunityPost = {
  id: string;
  author: string;
  role: "administrador" | "novato" | "usuario";
  content: string;
  media: string[];
  createdAt: string;
};
