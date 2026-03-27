"use client";

import { useParticipants, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RoomParticipants({
  focusedUserId,
  setFocusedUserId,
}: {
  focusedUserId: string | null;
  setFocusedUserId: (id: string) => void;
}) {
  const participants = useParticipants(); // 🔥 KEY CHANGE
  const tracks = useTracks([Track.Source.Camera]);
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Record<string, any>>({});

  // ✅ stable order
  const sortedParticipants = [...participants].sort((a, b) =>
    a.identity.localeCompare(b.identity),
  );

  // 🔥 fetch profiles
  useEffect(() => {
    async function loadProfiles() {
      const ids = sortedParticipants.map((p) => p.identity);
      if (ids.length === 0) return;

      const { data } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", ids);

      if (!data) return;

      setProfiles((prev) => {
        const updated = { ...prev };
        data.forEach((user) => {
          updated[user.id] = user;
        });
        return updated;
      });
    }

    loadProfiles();
  }, [participants]);

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-2 bg-black/60">
      {sortedParticipants.map((p) => {
        const id = p.identity;
        const user = profiles[id];
        const isActive = id === focusedUserId;

        // 🔥 check if they actually have video
        const hasVideo = tracks.some((t) => t.participant.identity === id);

        return (
          <div
            key={id}
            onClick={() => setFocusedUserId(id)}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            {/* avatar */}
            <div
              className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${
                isActive ? "border-white" : "border-transparent"
              }`}
            >
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name}
                  fill
                  sizes="64px"
                  className={`object-cover ${!hasVideo ? "opacity-50" : ""}`}
                />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
                  {id.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <p className="text-white text-xs text-center max-w-[64px] truncate">
              {user?.full_name || "User"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
