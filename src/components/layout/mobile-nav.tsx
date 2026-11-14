"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({
  user,
  links,
}: {
  user: { role: string } | null;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        className="rounded-lg p-2 hover:bg-graphite/5"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-line bg-white p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-semibold hover:bg-graphite/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10">
                    Admin panel
                  </Link>
                )}
                <Link href="/account" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-semibold hover:bg-graphite/5">
                  Account
                </Link>
                <button
                  className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-error hover:bg-error/5"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    location.href = "/";
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-semibold hover:bg-graphite/5">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-lg bg-graphite px-4 py-3 text-center text-sm font-semibold text-white">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
