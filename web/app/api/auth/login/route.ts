import { NextResponse } from "next/server";
import { backendPost, hasBackendUrl } from "@/lib/backend-api";
import { findDemoUser } from "@/lib/mock-auth";

export async function POST(request: Request) {
  const { matricula, password } = await request.json();

  if (hasBackendUrl()) {
    const backendResponse = await backendPost("/api/auth/login", { matricula, password });
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const response = NextResponse.json({
      ok: true,
      role: data.user.role,
      redirectTo: data.user.role === "administrador" ? "/dashboard" : "/home",
    });

    response.cookies.set("token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }

  const user = findDemoUser(String(matricula ?? ""), String(password ?? ""));

  if (!user) {
    return NextResponse.json(
      { error: "Matricula o contrasena incorrecta." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    redirectTo: user.role === "administrador" ? "/dashboard" : user.role === "novato" ? "/" : "/home",
  });

  response.cookies.set("token", `${user.role}:${user.matricula}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
