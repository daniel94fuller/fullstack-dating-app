"use server";

import { createClient } from "@/lib/supabase/server";

// ✅ GET EVENTS
export async function getEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      host:users(*),
      interests:event_interests(
        user:users(*)
      )
    `,
    )
    .order("event_time", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Failed to fetch events");
  }

  return data;
}

// ✅ CREATE EVENT (THIS IS WHAT YOU WERE MISSING)
export async function createEvent({
  title,
  description,
  location,
  eventTime,
}: {
  title: string;
  description: string;
  location: string;
  eventTime: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("events").insert({
    host_id: user.id,
    title,
    description,
    location,
    event_time: eventTime,
  });

  if (error) {
    console.error(error);
    throw new Error("Failed to create event");
  }

  return { success: true };
}
