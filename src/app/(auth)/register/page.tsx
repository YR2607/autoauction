import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold text-ink">Create account</h1>
        <p className="mt-2 text-sm text-muted">Join to bid in auctions and buy vehicles.</p>
        <AuthForm mode="register" />
      </main>
    </>
  );
}
