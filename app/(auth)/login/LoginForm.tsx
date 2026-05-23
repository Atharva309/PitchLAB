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
      <label className="block text-sm font-medium text-text-primary">
        Email
        <input
          type="email"
          required
          className="input-field mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-text-primary">
        Password
        <input
          type="password"
          required
          className="input-field mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={isLoading} className="w-full btn-primary">
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-text-secondary text-center">
        No account?{" "}
        <Link href="/register" className="text-accent font-medium hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
