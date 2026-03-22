"use server";

import { createClient } from "../supabase/server";

export async function getMatchFeed(userId: string) {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, created_at, user1_id, user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Match fetch error:", error);
    return [];
  }

  if (!matches || matches.length === 0) return [];

  const userIds = [
    ...new Set(matches.flatMap((m) => [m.user1_id, m.user2_id])),
  ];

  const { data: users, error: userError } = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  if (userError) {
    console.error("User fetch error:", userError);
    return [];
  }

  if (!users) return [];

  return matches.map((match) => {
    const userA = users.find((u) => u.id === match.user1_id);
    const userB = users.find((u) => u.id === match.user2_id);

    return {
      id: match.id,
      created_at: match.created_at,
      user1: userA || null,
      user2: userB || null,
    };
  });
}
