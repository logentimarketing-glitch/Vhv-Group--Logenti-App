import { NextResponse } from "next/server";
import { fetchMetaCommentCandidates } from "@/lib/meta";

export async function GET() {
  try {
    const candidates = await fetchMetaCommentCandidates();
    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudieron leer comentarios de Meta.",
        candidates: [],
      },
      { status: 500 },
    );
  }
}
