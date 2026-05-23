/**
 * AppHeader.tsx
 * Top navigation bar with PitchLab branding (Stitch design).
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AppHeaderProps = {
  userName: string;
  homeHref: string;
};

/**
 * Renders PitchLab header with logout and placeholder notification icon.
 */
export function AppHeader({ userName, homeHref }: AppHeaderProps): React.ReactElement {
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-page">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={homeHref} className="text-lg font-bold text-primary tracking-tight">
          PitchLab
        </Link>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          {/* TODO: notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-surface"
            disabled
            title="Notifications coming soon"
          >
            🔔
          </button>
          <span className="hidden sm:inline text-text-primary">{userName}</span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-text-secondary hover:text-primary font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
