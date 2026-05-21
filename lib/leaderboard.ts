/**
 * leaderboard.ts
 * Builds ranked leaderboard entries from attempts and profiles.
 */

import { scoreToGrade } from "@/lib/grades";
import type { LeaderboardEntry } from "@/types";

type AttemptRow = {
  id: string;
  student_id: string;
  total_score: number;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

/**
 * Maps Supabase join rows to sorted leaderboard entries.
 */
export function buildLeaderboard(attempts: AttemptRow[]): LeaderboardEntry[] {
  const sorted = [...attempts].sort((a, b) => b.total_score - a.total_score);
  return sorted.map((row, index) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: index + 1,
      student_id: row.student_id,
      student_name: profile?.full_name ?? "Student",
      total_score: row.total_score,
      grade: scoreToGrade(row.total_score),
      attempt_id: row.id,
    };
  });
}
