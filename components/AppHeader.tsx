/**
 * AppHeader.tsx
 * Top bar with PitchLab branding, user name, and logout.
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
 * Renders PitchLab header with logout action.
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
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={homeHref} className="text-lg font-bold text-gray-900">
          PitchLab
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{userName}</span>
          <button type="button" onClick={() => void handleLogout()} className="hover:text-gray-900">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
