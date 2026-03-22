"use server";

import { createClient } from "@/lib/supabase/server";

export const getMatchCount = async (userId: string) => {
  const supabase = await createClient(); // ✅ FIX

  const { data: matches, error } = await supabase
    .from("matches")
    .select("user1_id, user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("is_active", true);

  if (error || !matches) {
    console.error("Match count error:", error);
    return 0;
  }

  // 🔥 normalize SAME as feed
  const uniqueUserIds = new Set<string>();

  for (const m of matches) {
    const other = m.user1_id === userId ? m.user2_id : m.user1_id;
    if (other) uniqueUserIds.add(other);
  }

  return uniqueUserIds.size;
};
