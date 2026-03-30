"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// 🔥 disable SSR for Agora
const AgoraRoom = dynamic(() => import("@/components/AgoraRoom"), {
  ssr: false,
});

// ✅ FIX: params is now a Promise
export default function RoomPage(props: {
  params: Promise<{ roomId: string }>;
}) {
  const [uid, setUid] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    setUid(Math.floor(Math.random() * 1000000));

    async function loadParams() {
      const p = await props.params;
      setRoomId(p.roomId);
    }

    loadParams();
  }, [props.params]);

  if (!uid || !roomId) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <AgoraRoom channel={roomId} uid={uid.toString()} />;
}
