import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/features/auth/password-reset";
import { rateLimit } from "@/lib/rate-limit";

const body = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`pwdreset:${ip}`, 10)) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const res = resetPassword(parsed.data.token, parsed.data.password);
  if (!res.ok) {
    const msg =
      res.reason === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or already used.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
