"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import VideoRoom from "@/components/VideoRoom";

export default function RoomPage({ params }: any) {
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [joined, setJoined] = useState(false);

  async function joinRoom() {
    if (!user) return;

    const res = await fetch(
      `/api/livekit-token?room=${params.roomId}&username=${user.id}`,
    );

    const data = await res.json();
    setToken(data.token);
    setJoined(true);
  }

  if (!user) {
    return <div className="text-white p-6">Sign in to join</div>;
  }

  return (
    <div className="h-[calc(100vh-60px)] text-white">
      {!joined ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-xl font-semibold">Room: {params.roomId}</h2>

          <button
            onClick={joinRoom}
            className="
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-green-500 to-emerald-500
              font-semibold
              hover:scale-105 transition
            "
          >
            Join Room
          </button>
        </div>
      ) : (
        <VideoRoom token={token} />
      )}
    </div>
  );
}
