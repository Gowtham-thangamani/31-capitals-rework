/**
 * The account verification email.
 *
 * Built with tables and inline styles rather than modern CSS: Outlook and several
 * webmail clients strip <style> blocks, flexbox and grid. No remote images either,
 * since most clients block them by default and the code must stay readable when
 * they do — the mark is drawn with borders and text.
 */

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const BRAND = "#ff7a28";
const INK = "#f7f1ea";
const MUTED = "#8b8580";
const PAPER = "#0b0b0b";
const PANEL = "#141414";

export function verificationSubject(code: string) {
  // Leading the subject with the code lets people confirm from the notification.
  return `${code} is your 31 Capitals verification code`;
}

export function verificationHtml({
  code,
  name,
  minutes,
}: {
  code: string;
  name: string;
  minutes: number;
}) {
  const safeName = escapeHtml(name.trim().split(/\s+/)[0] || "there");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Your verification code</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <!-- Shown in the inbox preview line, then hidden in the body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your 31 Capitals verification code is ${code}. It expires in ${minutes} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px;background:${PANEL};border:1px solid #262626;border-radius:16px;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;">
              <span style="display:inline-block;font-size:19px;font-weight:bold;letter-spacing:-0.4px;color:${INK};">
                31&nbsp;<span style="color:${BRAND};">Capitals</span>
              </span>
            </td>
          </tr>

          <tr><td style="padding:0 32px;"><div style="height:1px;background:#262626;"></div></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;color:${INK};">
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:bold;color:${INK};">
                Confirm your email
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#cfc9c3;">
                Hello ${safeName}, use the code below to finish creating your account.
              </p>
            </td>
          </tr>

          <!-- The code -->
          <tr>
            <td style="padding:20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#0d0d0d;border:1px solid ${BRAND}55;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:22px 16px;font-family:'Courier New',Courier,monospace;
                             font-size:34px;font-weight:bold;letter-spacing:10px;color:${BRAND};">
                    ${code}
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">
                This code expires in ${minutes} minutes and can only be used once.
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:4px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
                Didn't request this? You can ignore this email — no account will be created.
                We will never ask you for this code by phone, email or message.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td style="padding:20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#6b6660;">
              <p style="margin:0 0 8px 0;">
                31 Capitals is an independent marketing and Introducing Broker brand. It is not a brokerage
                company, does not hold client funds, and does not provide investment advice.
              </p>
              <p style="margin:0;">
                This is an automated message sent because someone entered this address on 31capitals.com.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text alternative. Improves deliverability and serves text-only clients. */
export function verificationText({ code, name, minutes }: { code: string; name: string; minutes: number }) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return [
    `31 Capitals — confirm your email`,
    ``,
    `Hello ${first},`,
    ``,
    `Use this code to finish creating your account:`,
    ``,
    `    ${code}`,
    ``,
    `It expires in ${minutes} minutes and can only be used once.`,
    ``,
    `Didn't request this? Ignore this email — no account will be created.`,
    `We will never ask you for this code by phone, email or message.`,
    ``,
    `--`,
    `31 Capitals is an independent marketing and Introducing Broker brand.`,
    `It is not a brokerage company, does not hold client funds, and does not provide investment advice.`,
  ].join("\n");
}
