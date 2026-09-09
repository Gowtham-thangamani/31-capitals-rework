import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { countries, toE164 } from "@/lib/countries";
import { createLead, recentSendCount } from "@/lib/leads";
import {
  CODE_TTL_MS,
  COOKIE_NAME,
  deliveryConfigured,
  generateCode,
  hashCode,
  sendEmailCode,
  signPayload,
} from "@/lib/verification";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  country: z.string().length(2),
  number: z.string().trim().min(6).max(20),
});

const MAX_SENDS_PER_EMAIL = 3;
const RATE_WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check name, email, number and country." }, { status: 400 });
  }

  const { name, country, number } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (!countries.some((c) => c.iso === country)) {
    return NextResponse.json({ error: "Unsupported country." }, { status: 400 });
  }

  const phone = toE164(country, number);
  if (!/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid mobile number for the selected country." }, { status: 400 });
  }

  // This endpoint triggers outbound email, so it must not be freely repeatable.
  try {
    const recent = await recentSendCount(email, RATE_WINDOW_MINUTES);
    if (recent !== null && recent >= MAX_SENDS_PER_EMAIL) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 },
      );
    }
  } catch {
    // A rate-limit lookup failure must not block a genuine registration.
  }

  // Recorded before verification so the desk can see drop-offs, not just completions.
  let leadId: string | null = null;
  try {
    leadId = await createLead({
      name,
      email,
      phone,
      country,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: req.headers.get("user-agent"),
    });
  } catch (err) {
    console.error("[leads] failed to record lead:", err);
  }

  const emailCode = generateCode();
  const payload = {
    name,
    email,
    phone,
    country,
    leadId,
    emailHash: hashCode(emailCode, "email", email),
    exp: Date.now() + CODE_TTL_MS,
  };

  let emailSent = false;
  try {
    if (deliveryConfigured().email) emailSent = await sendEmailCode(email, emailCode, name);
  } catch {
    emailSent = false;
  }

  const res = NextResponse.json({
    ok: true,
    preview: !emailSent,
    emailDelivered: emailSent,
    ...(emailSent ? {} : { emailCode }),
  });

  res.cookies.set(COOKIE_NAME, signPayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CODE_TTL_MS / 1000,
  });

  return res;
}
