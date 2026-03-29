"use client";

import { UserProfile } from "@/app/profile/page";

export default function ProfilePostCard({
  user,
  onLike,
  onPass,
}: {
  user: UserProfile;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
}) {
  return (
    <div className="w-full flex justify-center">
      {/* 🔥 MAX WIDTH CONTAINER (prevents stretching) */}
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
          {/* 🔥 SQUARE IMAGE */}
          <div className="w-full aspect-square bg-black">
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* INFO */}
          <div className="p-4 space-y-2">
            {/* NAME */}
            <h3 className="text-lg font-semibold">{user.full_name}</h3>

            {/* META */}
            <p className="text-sm text-gray-400">
              San Francisco • Friendship, Networking
            </p>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => onPass(user.id)}
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-sm"
              >
                Not interested
              </button>

              <button
                onClick={() => onLike(user.id)}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-medium"
              >
                Interested
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
