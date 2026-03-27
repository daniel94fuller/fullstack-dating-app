"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import VideoRoom from "@/components/VideoRoom";
import { createClient } from "@/lib/supabase/client";
import { use } from "react";

export default function RoomPage(props: any) {
  const params = use(props.params);

  const { user } = useAuth();
  const supabase = createClient();

  const [token, setToken] = useState("");

  useEffect(() => {
    if (!user) return;

    async function joinRoom() {
      try {
        const res = await fetch(
          `/api/livekit-token?room=${params.roomId}&username=${user.id}`,
        );

        const data = await res.json();
        setToken(data.token);

        await supabase
          .from("rooms")
          .update({ last_active: new Date().toISOString() })
          .eq("id", params.roomId);
      } catch (err) {
        console.error("JOIN ROOM ERROR:", err);
      }
    }

    joinRoom();
  }, [user, params.roomId]);

  if (!user) {
    return <div className="text-white p-6">Sign in to join this room</div>;
  }

  if (!token) {
    return (
      <div className="h-[calc(100vh-60px)] flex items-center justify-center text-white">
        Connecting to room...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)]">
      <VideoRoom token={token} />
    </div>
  );
}
