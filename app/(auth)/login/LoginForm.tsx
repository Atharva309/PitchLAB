/**
 * LoginForm.tsx
 * Client login form (separated for useSearchParams).
 */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Email/password login with role-based redirect.
 */
export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user?.id ?? "")
      .single();

    const redirectTo = searchParams.get("redirect");
    router.push(
      redirectTo ??
        (profile?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard")
    );
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Email
        <input
          type="email"
          required
          className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Password
        <input
          type="password"
          required
          className="mt-1 w-full border border-gray-200 rounded px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-sm text-gray-500 text-center">
        No account?{" "}
        <Link href="/register" className="text-gray-900 font-medium underline">
          Register
        </Link>
      </p>
    </form>
  );
}
