import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forgot Password | AutoAuction" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Reset Password</h1>
        <p className="mt-1 text-xs text-[#64748b]">
          Enter your account email to receive a password reset link valid for 30 minutes.
        </p>
        <ForgotPasswordForm />
      </main>
      <SiteFooter />
    </div>
  );
}
