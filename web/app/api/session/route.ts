import { NextResponse } from "next/server";
import { parseSessionToken } from "@/lib/mock-auth";
import { cookies } from "next/headers";

export async function GET() {
  const token = cookies().get("token")?.value;
  const user = parseSessionToken(token);

  return NextResponse.json({
    authenticated: Boolean(user),
    user,
  });
}
