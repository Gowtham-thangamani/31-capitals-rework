import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { verificationHtml, verificationSubject, verificationText } from "@/lib/verification-email";

const SECRET = process.env.VERIFY_SECRET || "31capitals-local-dev-secret";
export const COOKIE_NAME = "tc_verify";
export const ADMIN_COOKIE_NAME = "tc_admin";
export const CODE_TTL_MS = 10 * 60 * 1000;
export const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;

export type VerifyPayload = {
  name: string;
  email: string;
  phone: string;
  country: string;
  leadId: string | null;
  emailHash: string;
  exp: number;
};

export function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string, channel: "email", salt: string) {
  return createHmac("sha256", SECRET).update(`${channel}:${salt}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function codesMatch(expectedHash: string, code: string, channel: "email", salt: string) {
  return safeEqual(expectedHash, hashCode(code.replace(/\s/g, ""), channel, salt));
}

function sign(body: string) {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

export function signPayload(payload: VerifyPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readPayload(token: string | undefined | null): VerifyPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as VerifyPayload;
    return parsed.exp < Date.now() ? null : parsed;
  } catch {
    return null;
  }
}

/* ---------- admin session ---------- */

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkAdminPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare digests so the check is constant-time regardless of length.
  return safeEqual(sign(`admin:${expected}`), sign(`admin:${candidate}`));
}

export function signAdminSession() {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + ADMIN_TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function isAdminSessionValid(token: string | undefined | null) {
  if (!token || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return false;
  try {
    return (JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp: number }).exp > Date.now();
  } catch {
    return false;
  }
}

/* ---------- delivery ---------- */

export function deliveryConfigured() {
  return { email: Boolean(process.env.RESEND_API_KEY) };
}

/**
 * Where verified registrations are sent: the 31 Capitals IB referral link, so
 * introductions are credited. Env-driven so it can be changed without a deploy;
 * the fallback is the same referral link rather than a bare signup URL, which
 * would silently drop attribution if the variable went missing.
 */
export function registerRedirectUrl() {
  return process.env.NEXT_PUBLIC_KVB_REGISTER_URL || "https://kvbcaf.com/0uyykjeev";
}

export async function sendEmailCode(to: string, code: string, name: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const from = process.env.EMAIL_FROM || "31 Capitals <noreply@31capitals.com>";
  const minutes = Math.round(CODE_TTL_MS / 60_000);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: verificationSubject(code),
      html: verificationHtml({ code, name, minutes }),
      // A text part is expected by spam filters and by text-only clients.
      text: verificationText({ code, name, minutes }),
      headers: {
        // Marks this as a transactional one-off so clients do not offer to unsubscribe
        // and mailing-list heuristics do not apply.
        "X-Entity-Ref-ID": `verify-${Date.now()}`,
      },
    }),
  });

  if (!res.ok) {
    console.error("[email] Resend rejected the message:", res.status, await res.text().catch(() => ""));
  }
  return res.ok;
}

