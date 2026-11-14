import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to bid, buy and track your vehicles.</p>
        <AuthForm mode="login" />
      </main>
    </>
  );
}
