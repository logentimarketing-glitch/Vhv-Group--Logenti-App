import { NextResponse } from "next/server";
import { getMetaConnectionStatus } from "@/lib/meta";

export async function GET() {
  const status = await getMetaConnectionStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}
