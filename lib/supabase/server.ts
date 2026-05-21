/**
 * server.ts
 * Server Supabase client for Server Components, API routes, and layouts.
 */

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client bound to the current request cookies.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = cookies();

  return createServerClient(url, key, {
    cookies: {
      get(name: string): string | undefined {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>): void {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* set from Server Component */
        }
      },
      remove(name: string, options: Record<string, unknown>): void {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          /* remove from Server Component */
        }
      },
    },
  });
}

/**
 * Service-role client for admin operations (bypasses RLS). Use only in API routes.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration");
  }
  return createSupabaseClient(url, key);
}
