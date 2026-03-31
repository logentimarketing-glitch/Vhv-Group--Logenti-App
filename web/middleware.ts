import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken } from "./lib/mock-auth";
import { getUserStatus } from "./lib/user-status";

const publicPaths = ["/", "/login", "/api/auth/login", "/api/ai/chatbot", "/api/session"];
const adminOnly = ["/dashboard", "/pipeline", "/marketing", "/talent"];
const authenticated = ["/home", "/lms", "/community", "/settings", "/talent", "/profiles", "/support", "/messages"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const user = parseSessionToken(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const status = getUserStatus(user);

  if (!user.isMaster && adminOnly.some((path) => pathname.startsWith(path)) && user.role !== "administrador") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (status === "TRAINEE" && ["/home", "/talent", "/messages"].some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (authenticated.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
