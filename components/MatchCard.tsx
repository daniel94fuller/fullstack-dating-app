"use client";

import { useRouter } from "next/navigation";
import { calculateAge } from "@/lib/helpers/calculate-age";
import UserAvatarSquare from "./UserAvatarSquare";

// ✅ LOCAL TYPE (correct)
type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  birthday?: string;
  bio?: string;
};

export default function MatchCard({ user }: { user: UserProfile }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="relative w-full max-w-sm mx-auto cursor-pointer"
    >
      <div className="card-swipe aspect-[3/4] overflow-hidden rounded-2xl">
        <div className="relative w-full h-full group">
          {/* IMAGE */}
          <UserAvatarSquare
            src={user.avatar_url}
            username={user.username}
            className="!rounded-none group-hover:scale-[1.03] transition duration-300"
          />

          {/* GRADIENT */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* TEXT */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {user.full_name},{" "}
                  {user.birthday ? calculateAge(user.birthday) : ""}
                </h2>

                <p className="text-sm opacity-90 mb-2">@{user.username}</p>

                <p className="text-sm leading-relaxed line-clamp-3">
                  {user.bio}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
