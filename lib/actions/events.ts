"use client";

import { createClient } from "@/lib/supabase/client";

// ===============================
// ✅ GET EVENTS
// ===============================
export async function getEvents() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        host:users (
          id,
          full_name,
          username,
          avatar_url
        ),
        interests:event_interests (
          user:users (
            id,
            full_name,
            username,
            avatar_url
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getEvents error:", error);
      return [];
    }

    const eventsWithScores = await Promise.all(
      (data || []).map(async (event: any) => {
        const { data: scores } = await supabase
          .from("room_scores")
          .select("*")
          .eq("room_id", event.id);

        const scored =
          scores?.map((s: any) => ({
            ...s,
            score: s.unique_viewers * 10 + s.watch_time * 0.1 + s.returns * 5,
          })) || [];

        const top = scored
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3);

        return {
          ...event,
          leaderboard: top,
        };
      }),
    );

    return eventsWithScores;
  } catch (err) {
    console.error("getEvents failed:", err);
    return [];
  }
}

// ===============================
// ✅ CREATE EVENT (FINAL FIX)
// ===============================
export async function createEvent(formData: {
  title: string;
  description: string;
  location: string;
  event_time: string;
}) {
  try {
    const supabase = createClient();

    // 🔥 HARD DEBUG
    const auth = await supabase.auth.getUser();

    console.log("AUTH DEBUG:", auth);

    const user = auth.data?.user;

    if (!user) {
      console.error("❌ USER NOT LOGGED IN");
      alert("You must be logged in to create an event");
      return null;
    }

    console.log("✅ USER ID:", user.id);

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          event_time: formData.event_time,
          host_id: user.id, // ✅ MUST MATCH POLICY
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ createEvent error:", error);
      return null;
    }

    console.log("✅ EVENT CREATED:", data);

    return data;
  } catch (err) {
    console.error("createEvent failed:", err);
    return null;
  }
}
