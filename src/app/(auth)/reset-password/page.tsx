import { SiteHeader } from "@/components/layout/site-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Set new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-extrabold">Set a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-4 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs text-[#64748b]">
            This page needs a valid reset link. Request one on the{" "}
            <a href="/forgot-password" className="font-semibold text-primary hover:underline">
              forgot password
            </a>{" "}
            page.
          </p>
        )}
      </main>
    </>
  );
}
