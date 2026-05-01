"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useGuestId } from "@/lib/hooks/useGuestId";

export default function Home() {
  const supabase = createClient();
  const guestId = useGuestId();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [guestAvatar, setGuestAvatar] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // =========================
  // LOAD PLANS
  // =========================
  async function loadPlans() {
    const { data } = await supabase
      .from("dm_channels")
      .select(
        `
        *,
        dm_participants (
          user_id,
          guest_id,
          name,
          avatar_url
        )
      `,
      )
      .order("starts_at", { ascending: true })
      .limit(20);

    setPlans(data || []);
    setLoading(false);
  }

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    async function load() {
      const userPromise = supabase.auth.getUser();
      const plansPromise = loadPlans();

      const {
        data: { user },
      } = await userPromise;

      setUser(user);

      const storedName = localStorage.getItem("guest_name");
      const storedAvatar = localStorage.getItem("guest_avatar");

      if (storedName) setGuestName(storedName);
      if (storedAvatar) setGuestAvatar(storedAvatar);

      await plansPromise;
    }

    load();
  }, []);

  // =========================
  // SCROLL TRACKING
  // =========================
  function handleScroll() {
    if (!scrollRef.current) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;

    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  }

  // =========================
  // JOIN PLAN
  // =========================
  async function joinPlan(planId: string) {
    const name = user?.user_metadata?.name || guestName || "Guest";
    const avatar = user?.user_metadata?.avatar_url || guestAvatar || null;

    await supabase.from("dm_participants").upsert({
      channel_id: planId,
      user_id: user?.id || null,
      guest_id: user ? null : guestId,
      name,
      avatar_url: avatar,
    });

    loadPlans();
  }

  // =========================
  // HELPERS
  // =========================
  function formatTime(date: string) {
    if (!date) return "No time set";

    return new Date(date).toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isJoined(plan: any) {
    return plan.dm_participants?.some(
      (p: any) =>
        (user && p.user_id === user.id) || (!user && p.guest_id === guestId),
    );
  }

  function Avatar({ name, src }: any) {
    if (src) {
      return (
        <img
          src={src}
          className="w-8 h-8 rounded-full object-cover border-2 border-white"
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs">
        {name?.[0]}
      </div>
    );
  }

  // =========================
  // LOADING
  // =========================
  if (loading && plans.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white/10 h-40 rounded-xl animate-pulse" />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="p-4">
      {/* CAROUSEL */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-hide"
      >
        {plans.map((plan) => {
          const joined = isJoined(plan);
          const mainAvatar = plan.dm_participants?.find(
            (p: any) => p.avatar_url,
          );

          return (
            <div
              key={plan.id}
              className="min-w-full snap-center bg-white rounded-xl p-4 text-black shadow"
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{plan.title || "Plan"}</h2>

                  <p className="text-sm text-gray-600">
                    {formatTime(plan.starts_at)}
                  </p>
                </div>

                {mainAvatar ? (
                  <img
                    src={mainAvatar.avatar_url}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg" />
                )}
              </div>

              {/* PARTICIPANTS */}
              <div className="flex gap-2 mt-4 items-center">
                {plan.dm_participants?.slice(0, 5).map((p: any, i: number) => (
                  <Avatar key={i} name={p.name} src={p.avatar_url} />
                ))}
              </div>

              <div className="text-sm text-gray-500 mt-2">
                {plan.dm_participants?.length || 0} going
              </div>

              {/* ACTION */}
              <div className="mt-4">
                {!joined ? (
                  <button
                    onClick={() => joinPlan(plan.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm"
                  >
                    Join
                  </button>
                ) : (
                  <Link
                    href={`/dm/${plan.id}`}
                    className="bg-black text-white px-4 py-2 rounded-full text-sm"
                  >
                    Enter
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DOT INDICATORS */}
      <div className="flex justify-center mt-4 gap-2">
        {plans.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition ${
              i === activeIndex ? "bg-black" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
