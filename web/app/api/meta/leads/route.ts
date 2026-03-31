import { NextResponse } from "next/server";
import { fetchMetaLeads } from "@/lib/meta";

export async function GET() {
  try {
    const candidates = await fetchMetaLeads();
    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo leer Meta.",
        candidates: [],
      },
      { status: 500 },
    );
  }
}
