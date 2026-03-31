import { cookies } from "next/headers";
import { demoUsers, parseSessionToken } from "@/lib/mock-auth";

export async function getCurrentUser() {
  const token = cookies().get("token")?.value;
  return parseSessionToken(token);
}

export function getAdminDirectory() {
  return demoUsers.filter((user) => user.role === "administrador" && user.showInPortal);
}
