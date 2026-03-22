"use client";

import { useRouter } from "next/navigation";

export default function CreateRoomButton() {
  const router = useRouter();

  function createRoom() {
    const roomId = crypto.randomUUID().slice(0, 8); // clean short ID
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
