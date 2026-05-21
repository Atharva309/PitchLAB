/**
 * layout.tsx — teacher section
 */

export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/AppHeader";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Teacher layout wrapper.
 */
export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const profile = await requireRole("teacher");
  return (
    <>
      <AppHeader userName={profile.full_name} homeHref="/teacher/dashboard" />
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </>
  );
}
