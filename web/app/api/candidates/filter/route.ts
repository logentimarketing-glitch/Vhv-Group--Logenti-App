import { NextResponse } from "next/server";
import { backendPost, hasBackendUrl } from "@/lib/backend-api";

export async function POST(request: Request) {
  const { query } = await request.json();
  const normalizedQuery = String(query ?? "").trim();

  if (hasBackendUrl()) {
    const backendResponse = await backendPost("/api/candidates/filter", {
      query: normalizedQuery,
    });
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  }

  return NextResponse.json({
    query: normalizedQuery,
    result: [],
    message:
      "El filtro IA queda listo para trabajar con candidatos reales cuando existan perfiles cargados en la plataforma.",
  });
}
