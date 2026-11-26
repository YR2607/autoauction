"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Shield, User } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import type { SessionUser } from "@/lib/auth/session";

export function MobileNav({
  user,
  links,
}: {
  user: SessionUser | null;
  links: { href: string; label: string; badge?: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="rounded-none p-2 text-white hover:bg-white/10"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <div
          id="mobile-nav-panel"
          className="anim-fade absolute inset-x-0 top-full border-b border-[#cbd5e1] bg-[#072a47] text-white shadow-xl z-50 p-4"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-white/10"
              >
                <span>{l.label}</span>
                {l.badge && (
                  <span className="rounded-none bg-[#cc0000] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/15" />
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-none px-3 py-2 text-sm font-bold text-[#ffb81c] hover:bg-white/10"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-none px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <div className="mt-2">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-none border border-white/40 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-none bg-[#ffb81c] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[#051a2e] hover:bg-[#e5a519]"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
