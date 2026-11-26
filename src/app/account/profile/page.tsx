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
      <h1 className="font-display text-2xl font-extrabold">Profile</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>
      <div className="mt-6 max-w-lg">
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
