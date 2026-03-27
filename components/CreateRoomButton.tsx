"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export default function CreateRoomButton() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  async function createRoom() {
    if (!user) return;

    const roomId = crypto.randomUUID().slice(0, 8);

    // ✅ save room to DB
    await supabase.from("rooms").insert({
      id: roomId,
      created_by: user.id,
    });

    router.push(`/rooms/${roomId}`);
  }

  return (
    <button
      onClick={createRoom}
      className="
        px-5 py-3 rounded-xl
        bg-gradient-to-r from-pink-500 to-red-500
        text-white font-semibold
        shadow-lg hover:scale-105 transition
      "
    >
      + Create Room
    </button>
  );
}
