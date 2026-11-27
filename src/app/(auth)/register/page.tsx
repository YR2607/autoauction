import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthForm } from "@/components/auth/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Register | AutoAuction" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Register Account</h1>
        <p className="mt-1 text-xs text-[#64748b]">Create an account to participate in live auctions and buy vehicles.</p>
        <AuthForm mode="register" />
      </main>
      <SiteFooter />
    </div>
  );
}
