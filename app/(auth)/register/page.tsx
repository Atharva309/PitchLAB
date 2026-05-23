/**
 * register/page.tsx
 * Sign up with name, email, password, and student/teacher role cards.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

/**
 * Registration form with role selection cards.
 */
export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }
    router.push(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md card-surface p-8 shadow-md border-t-4 border-t-gold">
        <h1 className="text-2xl font-bold text-primary">Create account</h1>
        <p className="text-sm text-text-secondary mt-1">Join PitchLab as a student or teacher</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-text-primary">
            Full name
            <input
              required
              className="input-field mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
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
              minLength={6}
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <p className="text-sm font-medium text-text-primary">I am a</p>
          <div className="grid grid-cols-2 gap-3">
            {(["student", "teacher"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 border rounded-lg text-sm font-medium capitalize transition-colors ${
                  role === r
                    ? "border-accent bg-accent text-white shadow-sm"
                    : "border-border text-text-secondary bg-surface hover:border-accent/50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full btn-primary">
            {isLoading ? "Creating…" : "Register"}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6 text-center">
          Have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
