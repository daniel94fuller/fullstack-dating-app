"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CreateRoomButton from "@/components/CreateRoomButton";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/actions/events";

export default function RoomsPage() {
  const supabase = createClient();

  const [rooms, setRooms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // 🔥 LOAD ROOMS
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (roomsData) setRooms(roomsData);

      // 🔥 LOAD EVENTS
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen text-white pt-20 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* 🔥 HEADER */}
        <div>
          <h1 className="text-3xl font-bold mb-2">🎥 Rooms</h1>
          <p className="text-white/60">Go live or join an existing room</p>
        </div>

        {/* 🔥 CREATE ROOM */}
        <CreateRoomButton />

        {/* 🔥 ROOMS LIST */}
        <div className="space-y-4">
          {loading && <p className="text-white/60">Loading rooms...</p>}

          {!loading && rooms.length === 0 && (
            <p className="text-white/60">No rooms yet</p>
          )}

          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="
                group block
                bg-zinc-900/80 backdrop-blur-lg
                border border-white/10
                rounded-2xl p-5
                hover:bg-zinc-800
                hover:scale-[1.02]
                transition-all
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Room {room.id}</p>
                  <p className="text-sm text-white/50">Always open</p>
                </div>

                <div className="px-4 py-2 bg-green-500 rounded-lg text-sm">
                  Join →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 🔥 EVENTS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📅 Events</h2>

            <Link href="/events/create">
              <button className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition">
                + Create Event
              </button>
            </Link>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
