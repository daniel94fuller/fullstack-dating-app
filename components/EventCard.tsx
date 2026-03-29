"use client";

import Image from "next/image";

export default function EventCard({ event }: any) {
  const host = event.host || {};

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md">
      {/* 🔥 HOST (SAFE) */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10">
          <Image
            src={host.avatar_url || "/default-avatar.png"}
            alt={host.username || "User"}
            fill
            className="rounded-full object-cover"
          />
        </div>

        <div>
          <p className="font-semibold">{host.full_name || "Popcircle"}</p>
          <p className="text-xs text-gray-500">
            @{host.username || "popcircle"}
          </p>
        </div>
      </div>

      {/* 🔥 EVENT INFO */}
      <h2 className="text-lg font-bold">{event.title}</h2>
      <p className="text-sm text-gray-500">{event.description}</p>

      <div className="mt-2 text-sm">📍 {event.location}</div>

      <div className="text-sm">
        🕒 {new Date(event.event_time).toLocaleString()}
      </div>

      {/* 🔥 INTERESTED USERS (SAFE) */}
      <div className="flex mt-4 -space-x-2">
        {(event.interests || []).slice(0, 5).map((i: any, idx: number) => {
          const user = i?.user;

          return (
            <div key={idx} className="relative w-8 h-8">
              <Image
                src={user?.avatar_url || "/default-avatar.png"}
                alt=""
                fill
                className="rounded-full border-2 border-white object-cover"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
