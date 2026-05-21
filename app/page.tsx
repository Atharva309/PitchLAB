/**
 * page.tsx
 * Root redirect to login or role-appropriate dashboard.
 */

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * Sends authenticated users to their dashboard; others to login.
 */
export default async function HomePage(): Promise<never> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(profile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
}
