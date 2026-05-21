/**
 * login/page.tsx
 */

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

/**
 * Login page shell.
 */
export default function LoginPage(): React.ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md border border-gray-200 rounded-lg bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">PitchLab</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        <Suspense fallback={<p className="mt-8 text-sm text-gray-500">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
