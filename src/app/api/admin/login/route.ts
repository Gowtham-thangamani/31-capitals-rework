import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkLoginAllowed, clearLoginAttempts, clientIp, recordFailedLogin } from "@/lib/admin-rate-limit";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_TTL_MS,
  adminPasswordConfigured,
  checkAdminPassword,
  signAdminSession,
} from "@/lib/verification";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: NextRequest) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  const ip = clientIp(req.headers);

  // One shared password guards every lead, so guessing must be expensive.
  const limit = await checkLoginAllowed(ip);
  if (limit.blocked) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterMinutes} minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterMinutes * 60) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success || !checkAdminPassword(parsed.data.password)) {
    await recordFailedLogin(ip);
    const left = Math.max(0, limit.remaining - 1);
    return NextResponse.json(
      { error: left > 0 ? `Incorrect password. ${left} attempt${left === 1 ? "" : "s"} left.` : "Incorrect password." },
      { status: 401 },
    );
  }

  await clearLoginAttempts(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TTL_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
