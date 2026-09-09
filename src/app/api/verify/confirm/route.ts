import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { markLeadVerified } from "@/lib/leads";
import { COOKIE_NAME, codesMatch, readPayload, registerRedirectUrl } from "@/lib/verification";

const schema = z.object({ emailCode: z.string().regex(/^\d{6}$/) });

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const payload = readPayload(req.cookies.get(COOKIE_NAME)?.value);
  if (!payload) {
    return NextResponse.json({ error: "Verification expired. Please request a new code." }, { status: 400 });
  }

  if (!codesMatch(payload.emailHash, parsed.data.emailCode, "email", payload.email)) {
    return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
  }

  if (payload.leadId) {
    try {
      await markLeadVerified(payload.leadId);
    } catch (err) {
      // Never block a verified user from continuing because of a database problem.
      console.error("[leads] failed to mark lead verified:", err);
    }
  }

  const res = NextResponse.json({ ok: true, redirectUrl: registerRedirectUrl() });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
