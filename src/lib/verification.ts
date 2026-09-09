import { createHmac, randomInt, timingSafeEqual } from "crypto";

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

/** Where verified registrations are sent. Env-driven so an IB tracking code can be added without a deploy. */
export function registerRedirectUrl() {
  return process.env.NEXT_PUBLIC_KVB_REGISTER_URL || "https://mykvb.com/register?lang=en-US";
}

export async function sendEmailCode(to: string, code: string, name: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "31 Capitals <noreply@31capitals.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Your 31 Capitals verification code",
      html: `
        <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:32px">
          <h2 style="color:#ff7a28;margin:0 0 12px">31 Capitals</h2>
          <p>Hello ${escapeHtml(name)},</p>
          <p>Your verification code is:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#ff7a28">${code}</p>
          <p style="color:#aaa;font-size:13px">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
    }),
  });
  return res.ok;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
