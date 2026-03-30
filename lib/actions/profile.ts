"use server";

import { createClient } from "../supabase/server";

// ✅ LOCAL TYPE (same as everywhere else)
type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  birthday?: string;
  bio?: string;
  email?: string;
  gender?: string;
  birthdate?: string;
  preferences?: any;
  location_lat?: number;
  location_lng?: number;
  last_active?: string;
  is_verified?: boolean;
  is_online?: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function updateUserProfile(profileData: Partial<UserProfile>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
