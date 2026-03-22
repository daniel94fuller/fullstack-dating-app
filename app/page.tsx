"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/lib/actions/matches";
import { UserProfile } from "@/app/profile/page";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/actions/events";
import UserAvatarBubble from "@/components/UserAvatarBubble";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const router = useRouter();

  // 🔥 Load events
  useEffect(() => {
    async function load() {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  // 🔥 Load users
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadUsers();
  }, []);

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 🔥 USER BUBBLES (ONLY horizontal scroll here) */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 py-3 min-w-max">
          {users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex flex-col items-center min-w-[70px] cursor-pointer active:scale-95 transition"
            >
              <UserAvatarBubble
                src={u.avatar_url}
                username={u.username}
                size={80}
              />

              <p className="text-xs mt-1 text-center truncate w-full">
                {u.username}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 🔥 CREATE EVENT */}
      {user && (
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push("/events/create")}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            + Create Event
          </button>
        </div>
      )}

      {/* 🔥 EVENTS (VERTICAL ONLY) */}
      <div className="px-4 space-y-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
