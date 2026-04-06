import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminOnly = ["/dashboard", "/pipeline", "/marketing", "/talent"];
const authenticated = ["/home", "/lms", "/community", "/settings", "/talent", "/profiles", "/support", "/messages", "/notifications"];

type SessionRole = "administrador" | "novato" | "usuario";
type SessionStatus = "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";

function parseToken(token: string | undefined) {
  if (!token) return null;

  const [role, matricula] = token.split(":");

  if (!role || !matricula) {
    return null;
  }

  const typedRole = role as SessionRole;
  const status: SessionStatus =
    typedRole === "administrador"
      ? "ADMIN"
      : typedRole === "novato"
        ? "TRAINEE"
        : "ACTIVE_EMPLOYEE";

  return {
    role: typedRole,
    matricula,
    isMaster: matricula === "271003",
    status,
  };
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const token = req.cookies.get("token")?.value;
  const user = parseToken(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!user.isMaster && adminOnly.some((path) => pathname.startsWith(path)) && user.role !== "administrador") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (user.status === "TRAINEE" && ["/home", "/talent", "/messages"].some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (authenticated.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/lms/:path*",
    "/community/:path*",
    "/settings/:path*",
    "/talent/:path*",
    "/profiles/:path*",
    "/support/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/dashboard/:path*",
    "/pipeline/:path*",
    "/marketing/:path*",
  ],
};
