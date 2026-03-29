"use client";

import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/actions/matches";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";
import { getGlobalActivity } from "@/lib/actions/activity";

// ✅ DEFINE TYPE LOCALLY (replaces broken import)
type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
};

export default function MatchesListPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activity, setActivity] = useState<any>({});

  useEffect(() => {
    async function load() {
      const usersData = await getAllUsers();
      const activityData = await getGlobalActivity();

      setUsers(usersData || []);
      setActivity(activityData || {});
    }

    load();
  }, []);

  return (
    <div className="w-full px-6 py-10">
      <h1 className="text-xl font-semibold mb-6">People</h1>

      <div className="flex flex-wrap gap-6">
        {users.map((user) => (
          <Link key={user.id} href={`/profile/${user.username}`}>
            <div className="flex flex-col items-center gap-2 cursor-pointer">
              <UserAvatarBubble src={user.avatar_url} size={70} />
              <span className="text-sm text-white/80">
                {user.full_name || user.username}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
