"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { UserProfile } from "@/app/profile/page";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";
import { getGlobalActivity } from "@/lib/actions/activity";
import ActivityCard from "@/components/ActivityCard";
import ProfilePostCard from "@/components/ProfilePostCard";
import {
  getPotentialMatches,
  getAllUsers,
  likeUser,
} from "@/lib/actions/matches";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  // 🔥 helper: compute circle counts + sort
  function sortByCircle(users: UserProfile[], matches: any[]) {
    const counts: Record<string, number> = {};

    users.forEach((u) => (counts[u.id] = 0));

    matches.forEach((m) => {
      if (counts[m.user1_id] !== undefined) counts[m.user1_id]++;
      if (counts[m.user2_id] !== undefined) counts[m.user2_id]++;
    });

    return [...users].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }

  // 🔥 Load ALL users (bubbles)
  useEffect(() => {
    async function loadAllUsers() {
      try {
        const users = await getAllUsers();

        const { data: matches } = await supabase
          .from("matches")
          .select("user1_id, user2_id")
          .eq("is_active", true);

        if (matches) {
          const sorted = sortByCircle(users, matches);
          setAllUsers(sorted);
        } else {
          setAllUsers(users);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadAllUsers();
  }, []);

  // 🔥 Load DISCOVER users (exclude self + sort)
  useEffect(() => {
    async function loadDiscover() {
      try {
        const users = await getPotentialMatches();

        const filtered = users.filter((u) => u.id !== user?.id);

        const { data: matches } = await supabase
          .from("matches")
          .select("user1_id, user2_id")
          .eq("is_active", true);

        if (matches) {
          const sorted = sortByCircle(filtered, matches);
          setDiscoverUsers(sorted);
        } else {
          setDiscoverUsers(filtered);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (user) loadDiscover();
  }, [user]);

  // 🔥 Load activity
  useEffect(() => {
    async function loadActivity() {
      const data = await getGlobalActivity();
      setActivity(data);
    }

    loadActivity();
  }, []);

  // 🔥 PASS
  function handlePass(id: string) {
    setDiscoverUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // 🔄 LOADING
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 🔥 USER BUBBLES (SORTED BY CIRCLE SIZE) */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-3 min-w-max">
          {allUsers.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex flex-col items-center min-w-[70px] cursor-pointer active:scale-95 transition"
            >
              <UserAvatarBubble
                src={u.avatar_url}
                username={u.username}
                size={80}
              />

              <p className="text-xs mt-1 text-center truncate w-full">
                {u.full_name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 🔥 ACTIVITY */}
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-lg font-semibold mb-2">🔥 Activity</h2>

        {activity.slice(0, 3).map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </div>

      {/* 🔥 DISCOVER (SORTED BY CIRCLE SIZE) */}
      <div className="px-4 mt-6 pb-10">
        <h2 className="text-lg font-semibold mb-4">👀 Discover</h2>

        <div className="max-w-xl mx-auto space-y-6">
          {discoverUsers.map((user) => (
            <ProfilePostCard
              key={user.id}
              user={user}
              onLike={async (id) => {
                await likeUser(id);
                setDiscoverUsers((prev) => prev.filter((u) => u.id !== id));
              }}
              onPass={handlePass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
