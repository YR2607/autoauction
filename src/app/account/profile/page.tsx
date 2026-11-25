import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ProfileForm } from "@/components/account/profile-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .get();

  return (
    <div>
      <div className="border-b-2 border-ink pb-4">
        <h1 className="font-display text-[28px] font-medium text-ink">Profile</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-tech">
          Member record · {user.email}
        </p>
      </div>
      <div className="mt-6">
        <ProfileForm
          initial={{
            firstName: profile?.firstName ?? "",
            lastName: profile?.lastName ?? "",
            phone: profile?.phone ?? "",
            addressLine: profile?.addressLine ?? "",
            city: profile?.city ?? "",
            country: profile?.country ?? "",
          }}
        />
      </div>
    </div>
  );
}
