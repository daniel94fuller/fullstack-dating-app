import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/client";

// 🔥 ALL USERS (FOR HOME BUBBLES)
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.from("users").select("*").limit(50);

    if (error) {
      console.error("getAllUsers error:", error);
      return [];
    }

    return (
      data?.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: "",
        gender: user.gender,
        birthdate: user.birthdate,
        bio: user.bio,
        avatar_url: user.avatar_url,
        preferences: user.preferences,
        location_lat: undefined,
        location_lng: undefined,
        last_active: new Date().toISOString(),
        is_verified: true,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || []
    );
  } catch (err) {
    console.error("getAllUsers failed:", err);
    return [];
  }
}

// ✅ FILTERED USER DISCOVERY
export async function getPotentialMatches(): Promise<UserProfile[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: sentLikes } = await supabase
      .from("likes")
      .select("to_user_id")
      .eq("from_user_id", user.id);

    const { data: matches } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq("is_active", true);

    const likedIds = sentLikes?.map((l) => l.to_user_id) || [];

    const matchedIds =
      matches?.map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id)) ||
      [];

    const excludeIds = [...new Set([...likedIds, ...matchedIds, user.id])];

    let query = supabase.from("users").select("*");

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error("getPotentialMatches error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getPotentialMatches failed:", err);
    return [];
  }
}

// ✅ FIXED LIKE USER (NO DUPLICATES + MATCH CREATION)
export async function likeUser(toUserId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    // ✅ CHECK IF ALREADY LIKED
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", user.id)
      .eq("to_user_id", toUserId)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("likes").insert({
        from_user_id: user.id,
        to_user_id: toUserId,
      });

      if (error) {
        console.error("likeUser insert error:", error);
        return { success: false };
      }
    }

    // ✅ CHECK FOR MUTUAL LIKE
    const { data: mutual } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", toUserId)
      .eq("to_user_id", user.id)
      .maybeSingle();

    if (mutual) {
      // ✅ PREVENT DUPLICATE MATCHES
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (!existingMatch) {
        await supabase.from("matches").insert({
          user1_id: user.id,
          user2_id: toUserId,
          is_active: true,
        });
      }

      const { data: matchedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", toUserId)
        .single();

      return {
        success: true,
        isMatch: true,
        matchedUser,
      };
    }

    return { success: true, isMatch: false };
  } catch (err) {
    console.error("likeUser failed:", err);
    return { success: false };
  }
}

// ✅ SAFE SKIP USER (NO DUPLICATES)
export async function skipUser(toUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("skipped")
    .select("id")
    .eq("from_user_id", user.id)
    .eq("to_user_id", toUserId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("skipped").insert({
      from_user_id: user.id,
      to_user_id: toUserId,
    });
  }
}

// 🔥 INCOMING LIKES
export async function getIncomingLikes(): Promise<UserProfile[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: likes } = await supabase
      .from("likes")
      .select("from_user_id, created_at")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!likes || likes.length === 0) return [];

    const userIds = likes.map((l) => l.from_user_id);

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds);

    return users || [];
  } catch (err) {
    console.error("getIncomingLikes failed:", err);
    return [];
  }
}
