"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

// 🔥 disable SSR for Agora
const AgoraRoom = dynamic(() => import("@/components/AgoraRoom"), {
  ssr: false,
});

export default function RoomPage(props: any) {
  const params = use(props.params);
  const supabase = createClient();

  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", user);

      if (!user) return;

      // 🔥 THIS IS THE REAL UUID
      setUid(user.id);
    }

    loadUser();
  }, []);

  if (!uid) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading user...
      </div>
    );
  }

  return <AgoraRoom channel={params.roomId} uid={uid} />;
}
