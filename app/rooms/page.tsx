"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CreateRoomButton from "@/components/CreateRoomButton";

export default function RoomsPage() {
  const supabase = createClient();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [hangoutEvent, setHangoutEvent] = useState<any | null>(null);
  const [hangoutGoing, setHangoutGoing] = useState<any[]>([]);

  // ===============================
  // 🔥 COMPUTE NEXT SUNDAY 7PM
  // ===============================
  function getNextSunday7PM() {
    const now = new Date();
    const result = new Date(now);

    const day = now.getDay();
    const diff = (7 - day) % 7;

    result.setDate(now.getDate() + diff);
    result.setHours(19, 0, 0, 0);

    return result;
  }

  const hangoutTime = getNextSunday7PM();
  const now = new Date();

  const isLive =
    now >= hangoutTime &&
    now <= new Date(hangoutTime.getTime() + 60 * 60 * 1000);

  const isBefore = now < hangoutTime;

  // ===============================
  // 🔥 LOAD ROOMS + REALTIME
  // ===============================
  useEffect(() => {
    async function loadRooms() {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .gt("active_count", 0) // 🔥 ONLY SHOW ACTIVE ROOMS
        .order("created_at", { ascending: false });

      setRooms(data || []);
      setLoading(false);
    }

    loadRooms();

    // 🔥 REALTIME SYNC
    const channel = supabase
      .channel("rooms-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        async () => {
          const { data } = await supabase
            .from("rooms")
            .select("*")
            .gt("active_count", 0) // 🔥 KEEP FILTER HERE TOO
            .order("created_at", { ascending: false });

          setRooms(data || []);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ===============================
  // 🔥 LOAD HANGOUT EVENT
  // ===============================
  useEffect(() => {
    async function loadHangout() {
      let { data: hangout } = await supabase
        .from("events")
        .select("*")
        .eq("title", "Popcircle Hangout")
        .limit(1)
        .maybeSingle();

      if (!hangout) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: created } = await supabase
          .from("events")
          .insert({
            title: "Popcircle Hangout",
            description: "Weekly hangout for everyone",
            location: "Online",
            event_time: hangoutTime.toISOString(),
            host_id: user?.id || null,
          })
          .select()
          .single();

        hangout = created;
      }

      setHangoutEvent(hangout);

      if (hangout?.id) {
        const { data: going } = await supabase
          .from("event_interests")
          .select(
            `
            user:users (
              id,
              full_name,
              avatar_url
            )
          `,
          )
          .eq("event_id", hangout.id);

        setHangoutGoing(going || []);
      }
    }

    loadHangout();
  }, []);

  // ===============================
  // 🔥 JOIN WAITLIST
  // ===============================
  async function joinWaitlist() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required");
      return;
    }

    if (!hangoutEvent?.id) return;

    const { error } = await supabase.from("event_interests").upsert({
      event_id: hangoutEvent.id,
      user_id: user.id,
    });

    if (error) {
      console.error("❌ waitlist error:", error);
      return;
    }

    const { data } = await supabase
      .from("event_interests")
      .select(
        `
        user:users (
          id,
          full_name,
          avatar_url
        )
      `,
      )
      .eq("event_id", hangoutEvent.id);

    setHangoutGoing(data || []);
  }

  return (
    <div className="min-h-screen text-white pt-20 px-4">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* 🔥 HEADER */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Hangouts</h1>
          <p className="text-white/60">
            Join the weekly Popcircle hangout or jump into a room
          </p>
        </div>

        {/* 🔥 POPCIRCLE HANGOUT */}
        {hangoutEvent && (
          <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-2">🔥 Popcircle Hangout</h2>

            <p className="text-sm text-white/70">Every Sunday at 7 PM</p>

            <div className="mt-2 text-sm text-white/50">
              🕒 {hangoutTime.toLocaleString()}
            </div>

            <div className="mt-4">
              {isLive && (
                <Link href={`/rooms/${hangoutEvent.id}`}>
                  <button className="w-full bg-green-500 py-2 rounded-lg">
                    Join Live →
                  </button>
                </Link>
              )}

              {isBefore && (
                <button
                  onClick={joinWaitlist}
                  className="w-full bg-yellow-500 py-2 rounded-lg"
                >
                  Join Waitlist
                </button>
              )}

              {!isLive && !isBefore && (
                <button className="w-full bg-gray-600 py-2 rounded-lg">
                  Event Ended
                </button>
              )}
            </div>

            {/* 🔥 GOING */}
            {hangoutGoing.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-white/50 mb-1">Going</p>

                <div className="flex -space-x-2">
                  {hangoutGoing.slice(0, 6).map((g: any, i: number) => (
                    <img
                      key={i}
                      src={g.user.avatar_url || "/default-avatar.png"}
                      className="w-8 h-8 rounded-full border-2 border-black"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🔥 CREATE ROOM */}
        <CreateRoomButton />

        {/* 🔥 ROOMS */}
        <div className="space-y-4">
          {loading && <p className="text-white/60">Loading rooms...</p>}

          {!loading && rooms.length === 0 && (
            <p className="text-white/60">No active rooms</p>
          )}

          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="bg-zinc-900 p-5 rounded-2xl block hover:bg-zinc-800 transition"
            >
              Room {room.id}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
