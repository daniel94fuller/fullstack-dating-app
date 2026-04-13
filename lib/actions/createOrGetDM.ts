"use server";

import { createClient } from "@/lib/supabase/server";

export async function createOrGetDM({
  otherUserId,
  guestId,
}: {
  otherUserId: string;
  guestId?: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  const selfId = userId || guestId;

  // 🔥 HARD GUARD
  if (!selfId || !otherUserId) {
    throw new Error("Missing identity");
  }

  // Try existing
  const { data: existing } = await supabase
    .from("dm_channels")
    .select("*")
    .or(
      `and(user_1.eq.${selfId},user_2.eq.${otherUserId}),and(user_1.eq.${otherUserId},user_2.eq.${selfId})`,
    )
    .maybeSingle();

  if (existing) return existing.id;

  // Create new
  const { data, error } = await supabase
    .from("dm_channels")
    .insert({
      user_1: selfId,
      user_2: otherUserId,
    })
    .select()
    .single();

  if (error) throw error;

  return data.id;
}
