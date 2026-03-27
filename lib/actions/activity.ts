"use client";

import { createClient } from "@/lib/supabase/client";

export async function getGlobalActivity() {
  const supabase = createClient(); // ✅ CLIENT SAFE

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      created_at,
      user1:users!matches_user1_id_fkey (id, full_name, avatar_url),
      user2:users!matches_user2_id_fkey (id, full_name, avatar_url)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("ACTIVITY ERROR:", error);
    return [];
  }

  return data;
}
