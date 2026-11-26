import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In | AutoAuction" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Member Sign In</h1>
        <p className="mt-1 text-xs text-[#64748b]">Sign in to bid, buy and track vehicle auctions.</p>
        <AuthForm mode="login" />
      </main>
      <SiteFooter />
    </div>
  );
}
