"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// 🔥 disable SSR for Agora
const AgoraRoom = dynamic(() => import("@/components/AgoraRoom"), {
  ssr: false,
});

// ✅ FIX: properly type params
export default function RoomPage({ params }: { params: { roomId: string } }) {
  const [uid, setUid] = useState<number | null>(null);

  useEffect(() => {
    setUid(Math.floor(Math.random() * 1000000));
  }, []);

  if (!uid) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <AgoraRoom channel={params.roomId} uid={uid.toString()} />;
}
