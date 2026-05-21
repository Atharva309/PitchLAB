/**
 * layout.tsx — student section
 * Requires student role; renders PitchLab header.
 */

export const dynamic = "force-dynamic";

import { AppHeader } from "@/components/AppHeader";
import { requireRole } from "@/lib/auth-helpers";

/**
 * Student layout wrapper.
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const profile = await requireRole("student");
  return (
    <>
      <AppHeader userName={profile.full_name} homeHref="/student/dashboard" />
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </>
  );
}
