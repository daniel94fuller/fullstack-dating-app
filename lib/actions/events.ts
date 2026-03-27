import { createClient } from "@/lib/supabase/client";

// ✅ GET EVENTS
export async function getEvents() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getEvents error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getEvents failed:", err);
    return [];
  }
}
