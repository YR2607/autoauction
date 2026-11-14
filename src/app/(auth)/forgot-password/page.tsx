import { SiteHeader } from "@/components/layout/site-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your account email — we'll send a reset link valid for 30 minutes.
        </p>
        <ForgotPasswordForm />
      </main>
    </>
  );
}
