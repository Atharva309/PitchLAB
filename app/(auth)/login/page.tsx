/**
 * login/page.tsx
 * Stitch-style login card shell.
 */

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

/**
 * Login page shell.
 */
export default function LoginPage(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md card-surface p-8 shadow-md border-t-4 border-t-accent">
        <h1 className="text-2xl font-bold text-primary">PitchLab</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to continue your training</p>
        <Suspense fallback={<p className="mt-8 text-sm text-text-secondary">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
