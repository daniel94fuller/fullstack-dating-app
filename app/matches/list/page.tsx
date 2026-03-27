"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/actions/matches";
import { UserProfile } from "@/app/profile/page";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";
import { getGlobalActivity } from "@/lib/actions/activity";
import ActivityCard from "@/components/ActivityCard";
import UserAvatarSquare from "@/components/UserAvatarSquare";
import { calculateAge } from "@/lib/helpers/calculate-age";

export default function Home() {
  const { loading } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  // 🔥 Load users
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadUsers();
  }, []);

  // 🔥 Load activity
  useEffect(() => {
    async function loadActivity() {
      const data = await getGlobalActivity();
      setActivity(data);
    }

    loadActivity();
  }, []);

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 🔥 USER BUBBLES (UNCHANGED) */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-3 min-w-max">
          {users.map((u) => (
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

      {/* 🔥 ACTIVITY (LIMIT 3) */}
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-lg font-semibold mb-2">🔥 Activity</h2>

        {activity.slice(0, 3).map((item) => (
          <ActivityCard key={item.id} item={item} />
        ))}
      </div>

      {/* 🔥 DISCOVER (MATCHES STYLE LIST) */}
      <div className="px-4 mt-6 pb-10">
        <h2 className="text-lg font-semibold mb-4">👀 Discover</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 shadow hover:bg-zinc-700 transition block"
            >
              <div className="flex items-center space-x-4">
                {/* AVATAR */}
                <div className="w-16 h-16 flex-shrink-0">
                  <UserAvatarSquare
                    src={user.avatar_url}
                    username={user.username}
                    className="!rounded-full"
                  />
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">
                    {user.full_name}
                    {user.birthdate && <> , {calculateAge(user.birthdate)}</>}
                  </h3>

                  <p className="text-sm text-zinc-400 mb-1">@{user.username}</p>

                  {user.bio && (
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>

                {/* ONLINE DOT */}
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
