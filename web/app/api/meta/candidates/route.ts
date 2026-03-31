import { NextResponse } from "next/server";
import { fetchMetaCommentCandidates, fetchMetaLeads, mergeCandidates } from "@/lib/meta";

export async function GET() {
  try {
    const [commentCandidates, leadCandidates] = await Promise.all([
      fetchMetaCommentCandidates().catch(() => []),
      fetchMetaLeads().catch(() => []),
    ]);

    const candidates = mergeCandidates(commentCandidates, leadCandidates);

    return NextResponse.json({
      ok: true,
      candidates,
      sources: {
        comments: commentCandidates.length,
        leads: leadCandidates.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo importar desde Meta.",
        candidates: [],
      },
      { status: 500 },
    );
  }
}
