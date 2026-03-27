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
  const firstName = user.full_name?.split(" ")[0] || "User";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10">
      {/* IMAGE */}
      <img
        src={user.avatar_url || "/default-avatar.png"}
        className="w-full h-[420px] object-cover"
      />

      {/* OVERLAY (gradient) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* NAME */}
      <div className="absolute bottom-20 left-4 text-white">
        <h2 className="text-xl font-semibold">{firstName}</h2>
      </div>

      {/* ACTION BUTTONS */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6">
        {/* ❌ NOT INTERESTED */}
        <button
          onClick={() => onPass(user.id)}
          className="bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm"
        >
          ❌ Not Interested
        </button>

        {/* ✅ INTERESTED */}
        <button
          onClick={() => onLike(user.id)}
          className="bg-green-500 px-4 py-2 rounded-full text-sm flex items-center gap-1"
        >
          ✔ Interested
        </button>
      </div>
    </div>
  );
}
