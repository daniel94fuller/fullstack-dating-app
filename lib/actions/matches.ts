"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

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

// ✅ FILTERED USER DISCOVERY (FOR SWIPING)
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

    return (
      data?.map((match) => ({
        id: match.id,
        full_name: match.full_name,
        username: match.username,
        email: "",
        gender: match.gender,
        birthdate: match.birthdate,
        bio: match.bio,
        avatar_url: match.avatar_url,
        preferences: match.preferences,
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
    console.error("getPotentialMatches failed:", err);
    return [];
  }
}

// ✅ LIKE USER
export async function likeUser(toUserId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { error: likeError } = await supabase.from("likes").insert({
      from_user_id: user.id,
      to_user_id: toUserId,
    });

    if (likeError) {
      console.error("likeUser insert error:", likeError);
      return { success: false };
    }

    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", toUserId)
      .eq("to_user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      const { data: matchedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", toUserId)
        .single();

      return {
        success: true,
        isMatch: true,
        matchedUser: matchedUser as UserProfile,
      };
    }

    return { success: true, isMatch: false };
  } catch (err) {
    console.error("likeUser failed:", err);
    return { success: false };
  }
}

// ✅ GET MATCHES
export async function getUserMatches(): Promise<UserProfile[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq("is_active", true);

    if (!matches || matches.length === 0) return [];

    const otherUserIds = matches.map((match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id,
    );

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .in("id", otherUserIds);

    if (!users) return [];

    return users.map((otherUser, index) => ({
      id: otherUser.id,
      full_name: otherUser.full_name,
      username: otherUser.username,
      email: otherUser.email,
      gender: otherUser.gender,
      birthdate: otherUser.birthdate,
      bio: otherUser.bio,
      avatar_url: otherUser.avatar_url,
      preferences: otherUser.preferences,
      location_lat: undefined,
      location_lng: undefined,
      last_active: new Date().toISOString(),
      is_verified: true,
      is_online: false,
      created_at: matches[index]?.created_at,
      updated_at: matches[index]?.created_at,
    }));
  } catch (err) {
    console.error("getUserMatches failed:", err);
    return [];
  }
}

// 🔥 INCOMING LIKES (FIXED)
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

    if (!users) return [];

    return users.map((liker) => {
      const like = likes.find((l) => l.from_user_id === liker.id);

      return {
        id: liker.id,
        full_name: liker.full_name,
        username: liker.username,
        email: liker.email,
        gender: liker.gender,
        birthdate: liker.birthdate,
        bio: liker.bio,
        avatar_url: liker.avatar_url,
        preferences: liker.preferences,
        location_lat: undefined,
        location_lng: undefined,
        last_active: new Date().toISOString(),
        is_verified: true,
        is_online: false,
        created_at: like?.created_at,
        updated_at: like?.created_at,
      };
    });
  } catch (err) {
    console.error("getIncomingLikes failed:", err);
    return [];
  }
}
