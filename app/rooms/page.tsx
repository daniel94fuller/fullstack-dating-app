import CreateRoomButton from "@/components/CreateRoomButton";
import Link from "next/link";

export default function RoomsPage() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Public Rooms</h1>

      <CreateRoomButton />

      {/* OPTIONAL: manual join */}
      <div className="mt-6">
        <p className="text-white/70 mb-2">Join a room:</p>

        <Link href="/rooms/demo" className="text-blue-400 underline">
          Join Demo Room
        </Link>
      </div>
    </div>
  );
}
