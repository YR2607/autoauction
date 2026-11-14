import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/features/auth/password-reset";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({ email: z.email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`pwdforgot:${ip}`, 5)) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    await requestPasswordReset(parsed.data.email);
  } catch (e) {
    console.error("password reset mail failed", e);
    return NextResponse.json(
      { error: "Email delivery is not configured. Contact support." },
      { status: 503 },
    );
  }
  // Always 200 — never reveal whether the account exists.
  return NextResponse.json({ ok: true });
}
