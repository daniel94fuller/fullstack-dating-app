"use client";

import { getCurrentUserProfile } from "@/lib/actions/profile";
import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateAge } from "@/lib/helpers/calculate-age";
import UserAvatarBubble from "@/components/UserAvatarBubble";

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  gender: "male" | "female" | "other";
  birthdate: string;
  bio: string;
  avatar_url: string;
  preferences: UserPreferences;
  location_lat?: number;
  location_lng?: number;
  last_active: string;
  is_verified: boolean;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  age_range: {
    min: number;
    max: number;
  };
  distance: number;
  gender_preference: ("male" | "female" | "other")[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await getCurrentUserProfile();
        if (profileData) {
          setProfile(profileData);
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading profile: ", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>

          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>

          <p className="mb-6">
            {error || "Unable to load your profile. Please try again."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p>Manage your profile and preferences</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-8">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative rounded-full p-[2px]">
                    <UserAvatarBubble src={profile.avatar_url} size={96} />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">
                      {profile.full_name}, {calculateAge(profile.birthdate)}
                    </h2>

                    <p className="mb-2">@{profile.username}</p>

                    <p className="text-sm">
                      Member since{" "}
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* ABOUT */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">About Me</h3>
                    <p>{profile.bio || "No bio added yet."}</p>
                  </div>

                  {/* BASIC */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Basic Information
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Gender</label>
                        <p className="capitalize">{profile.gender}</p>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Birthday</label>
                        <p>
                          {new Date(profile.birthdate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PREFERENCES */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Dating Preferences
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Age Range</label>
                        <p>
                          {profile.preferences.age_range.min} -{" "}
                          {profile.preferences.age_range.max} years
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Distance</label>
                        <p>Up to {profile.preferences.distance} km</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* ACTIONS */}
              <div className="rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

                <div className="space-y-3">
                  <Link
                    href="/profile/edit"
                    className="flex items-center justify-between p-3 rounded-lg transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>

                      <span>Edit Profile</span>
                    </div>

                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* ACCOUNT */}
              <div className="rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Account</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <span>Username</span>
                    <span>@{profile.username}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
