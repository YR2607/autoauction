// Email adapter — pluggable transport, no fake delivery.
//
// EMAIL_TRANSPORT:
//   "outbox"  (default in dev) — appends messages to data/outbox.log + logs.
//             Explicitly a development transport; in production it throws
//             unless EMAIL_ALLOW_OUTBOX=1 is set (e.g. for smoke tests).
//   "webhook" — POSTs a JSON payload to EMAIL_WEBHOOK_URL (your provider's
//             inbound endpoint: SES relay, internal mailer, Zapier, etc).
//
// Anything else / missing in production → sendMail rejects so callers can
// surface "email not configured" instead of silently dropping mail.
import fs from "node:fs";
import path from "node:path";

export type MailMessage = { to: string; subject: string; text: string };

const transport = () => process.env.EMAIL_TRANSPORT ?? "outbox";

async function sendWebhook(msg: MailMessage) {
  const url = process.env.EMAIL_WEBHOOK_URL;
  if (!url) throw new Error("EMAIL_WEBHOOK_URL not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        from: process.env.EMAIL_FROM ?? "noreply@autoauction.local",
      }),
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`mail webhook returned ${r.status}`);
  } finally {
    clearTimeout(timer);
  }
}

function sendOutbox(msg: MailMessage) {
  if (process.env.NODE_ENV === "production" && process.env.EMAIL_ALLOW_OUTBOX !== "1") {
    throw new Error("outbox transport is for development only");
  }
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const line = `[${new Date().toISOString()}] TO=${msg.to} SUBJECT=${msg.subject}\n${msg.text}\n---\n`;
  fs.appendFileSync(path.join(dir, "outbox.log"), line);
  console.info(`[email:outbox] to=${msg.to} subject=${msg.subject}`);
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const t = transport();
  if (t === "webhook") return sendWebhook(msg);
  if (t === "outbox") return sendOutbox(msg);
  throw new Error(`Unknown EMAIL_TRANSPORT: ${t}`);
}
