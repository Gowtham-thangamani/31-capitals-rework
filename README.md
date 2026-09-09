# 31 Capitals

Premium one-page site for **31 Capitals**, an independent marketing and Introducing Broker brand connecting traders and business partners with established brokerage companies.

## What this site does

- Dark, high-contrast brand experience with a quiet diamond loader, live 3D globe and activity chart.
- Explains the 31 Capitals offer for clients, IBs, and Sub-IBs worldwide.
- Collects name, email, mobile number, and country.
- Sends a verification code to email and a separate code to SMS.
- After both codes are confirmed, the visitor is marked verified for the 31 Capitals desk.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Verification delivery

Without provider keys, the form still works in **preview mode**: codes are generated and shown on screen so you can complete the flow. If only email or only SMS is connected, that channel is sent for real and the other code stays on screen.

To send real messages, copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `VERIFY_SECRET` | Signs the verification cookie |
| `RESEND_API_KEY` | Sends the email code via [Resend](https://resend.com) |
| `EMAIL_FROM` | Verified sender, e.g. `31 Capitals <noreply@yourdomain.com>` |
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM` | Twilio from-number in E.164 |

When both providers succeed, codes are no longer returned to the browser.

## Stack

Next.js, TypeScript, Tailwind CSS, React Three Fiber, Drei.

31 Capitals does not provide regulated brokerage services. Clients contract with the brokerage entity named in their account documents.
