type Role = "admin" | "manager" | "user";

export async function getUserRole(token: string): Promise<Role | null> {
  if (!token) return null;
  if (token.startsWith("admin")) return "admin";
  if (token.startsWith("manager")) return "manager";
  return "user";
}
